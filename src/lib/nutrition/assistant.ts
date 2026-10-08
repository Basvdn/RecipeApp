import Anthropic from "@anthropic-ai/sdk";
import {
  addEntries,
  deleteEntries,
  getDayLog,
  getEntry,
  setGoals,
  updateEntry,
} from "@/lib/repositories/foodLog";
import { isIsoDate } from "@/lib/nutrition/dates";
import { MEALS, type ChatTurn, type DayLog, type FoodEntryInput, type Meal } from "@/types/nutrition";

const MODEL = "claude-opus-5-5";
const MAX_TOOL_ROUNDS = 8;

// Lazily constructed so the rest of the app works without an API key configured.
let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}

// Kept byte-stable across requests so it stays in the prompt cache; everything that changes per
// request (date, today's log) goes in a mid-conversation system message instead.
const SYSTEM_PROMPT = `You are the food-logging assistant inside a personal calorie and macro tracker. The user tells you what they ate, in casual language and often by voice (so expect speech-to-text slips), and you keep their food log accurate.

How to work:
- When the user mentions food they ate, call log_foods right away with one item per distinct food. Estimate calories, protein, carbs and fat from typical nutrition data for the stated portion. Do not ask for confirmation first; logging is easy to correct afterwards.
- If no portion is given, assume a typical single serving and state the portion you assumed in the item's quantity field (e.g. "1 medium (≈120 g)").
- Only ask a clarifying question when the food itself is genuinely ambiguous and the answer would change the numbers a lot (e.g. "a coffee" could be black or a large latte). Otherwise make a sensible assumption and mention it briefly.
- Infer the meal from what the user says; if they don't say, infer it from the current local time (before 10:30 breakfast, 10:30-15:00 lunch, 17:00-21:30 dinner, otherwise snack).
- The context message gives today's date and the day the user is currently looking at in the app. Foods without an explicit day go on the day they are looking at. Resolve "yesterday", weekday names, etc. relative to today.
- To correct or remove something already logged, use update_entry or delete_entries with the entry ids shown in the context message. Use get_day_log to look at any other day.
- When the user states targets ("my goal is 2200 calories and 160 g protein"), call set_goals with only the values they gave.
- Questions like "how much protein do I have left?" are answered from the totals and goals in the context message (or get_day_log for other days); no tool call is needed for the day being viewed.

Replies are shown in a small chat bubble on a phone: after logging, reply in one or two short sentences, naming what you logged with its calories, and the day's new calorie total versus goal. No markdown headings or tables; plain sentences only.`;

const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "log_foods",
    description:
      "Add one or more foods to the user's food log. Use one item per distinct food. All macro values are your best estimate for the stated portion.",
    input_schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Short food name, e.g. 'Greek yogurt, 2% fat'" },
              quantity: { type: "string", description: "Portion eaten, e.g. '200 g' or '2 slices'" },
              meal: { type: "string", enum: [...MEALS] },
              date: { type: "string", description: "Day eaten, YYYY-MM-DD" },
              calories: { type: "number" },
              protein_g: { type: "number" },
              carbs_g: { type: "number" },
              fat_g: { type: "number" },
            },
            required: ["name", "quantity", "meal", "date", "calories", "protein_g", "carbs_g", "fat_g"],
          },
        },
      },
      required: ["items"],
    },
  },
  {
    name: "update_entry",
    description:
      "Correct an existing log entry by id. Only include the fields that change; when the portion changes, also send recalculated calories and macros.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "integer" },
        name: { type: "string" },
        quantity: { type: "string" },
        meal: { type: "string", enum: [...MEALS] },
        calories: { type: "number" },
        protein_g: { type: "number" },
        carbs_g: { type: "number" },
        fat_g: { type: "number" },
      },
      required: ["id"],
    },
  },
  {
    name: "delete_entries",
    description: "Remove entries from the food log by id.",
    input_schema: {
      type: "object",
      properties: { ids: { type: "array", items: { type: "integer" } } },
      required: ["ids"],
    },
  },
  {
    name: "set_goals",
    description: "Update the user's daily targets. Only include the values the user specified.",
    input_schema: {
      type: "object",
      properties: {
        calories: { type: "number" },
        protein_g: { type: "number" },
        carbs_g: { type: "number" },
        fat_g: { type: "number" },
      },
    },
  },
  {
    name: "get_day_log",
    description: "Read the food log, totals and goals for a given day.",
    input_schema: {
      type: "object",
      properties: { date: { type: "string", description: "YYYY-MM-DD" } },
      required: ["date"],
    },
  },
];

class ToolInputError extends Error {}

function num(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new ToolInputError(`${field} must be a non-negative number`);
  }
  return value;
}

function optNum(value: unknown, field: string): number | undefined {
  return value === undefined || value === null ? undefined : num(value, field);
}

function meal(value: unknown): Meal {
  if (typeof value !== "string" || !(MEALS as readonly string[]).includes(value)) {
    throw new ToolInputError(`meal must be one of ${MEALS.join(", ")}`);
  }
  return value as Meal;
}

function formatDayLog(log: DayLog): string {
  const lines = log.entries.map(
    (e) =>
      `- id ${e.id} | ${e.meal} | ${e.name}${e.quantity ? ` (${e.quantity})` : ""} | ${e.calories} kcal, P ${e.proteinG} g, C ${e.carbsG} g, F ${e.fatG} g`
  );
  const t = log.totals;
  const g = log.goals;
  return [
    `Food log for ${log.date}:`,
    lines.length ? lines.join("\n") : "(nothing logged)",
    `Totals: ${t.calories} kcal, P ${t.proteinG} g, C ${t.carbsG} g, F ${t.fatG} g`,
    `Goals: ${g.calories} kcal, P ${g.proteinG} g, C ${g.carbsG} g, F ${g.fatG} g`,
  ].join("\n");
}

/** Runs one tool call against the database and returns the text result for Claude. */
function runTool(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case "log_foods": {
      if (!Array.isArray(input.items) || input.items.length === 0) {
        throw new ToolInputError("items must be a non-empty array");
      }
      const items: FoodEntryInput[] = input.items.map((raw: Record<string, unknown>) => {
        if (typeof raw.name !== "string" || !raw.name.trim()) throw new ToolInputError("name is required");
        if (!isIsoDate(raw.date)) throw new ToolInputError("date must be YYYY-MM-DD");
        return {
          name: raw.name,
          quantity: typeof raw.quantity === "string" ? raw.quantity : null,
          meal: meal(raw.meal),
          date: raw.date,
          calories: num(raw.calories, "calories"),
          proteinG: num(raw.protein_g, "protein_g"),
          carbsG: num(raw.carbs_g, "carbs_g"),
          fatG: num(raw.fat_g, "fat_g"),
        };
      });
      const created = addEntries(items);
      return `Logged ${created.length} item(s): ${created.map((e) => `id ${e.id} ${e.name}`).join("; ")}.\n\n${formatDayLog(getDayLog(created[0].date))}`;
    }
    case "update_entry": {
      const id = Number(input.id);
      const existing = getEntry(id);
      if (!existing) throw new ToolInputError(`No entry with id ${input.id}`);
      updateEntry(id, {
        name: typeof input.name === "string" ? input.name : undefined,
        quantity: typeof input.quantity === "string" ? input.quantity : undefined,
        meal: input.meal === undefined ? undefined : meal(input.meal),
        calories: optNum(input.calories, "calories"),
        proteinG: optNum(input.protein_g, "protein_g"),
        carbsG: optNum(input.carbs_g, "carbs_g"),
        fatG: optNum(input.fat_g, "fat_g"),
      });
      return `Updated entry ${id}.\n\n${formatDayLog(getDayLog(existing.date))}`;
    }
    case "delete_entries": {
      const ids = Array.isArray(input.ids) ? input.ids.map(Number).filter(Number.isInteger) : [];
      if (ids.length === 0) throw new ToolInputError("ids must be a non-empty array of integers");
      const dates = new Set(ids.map((id) => getEntry(id)?.date).filter((d): d is string => !!d));
      const removed = deleteEntries(ids);
      return [`Deleted ${removed} entr${removed === 1 ? "y" : "ies"}.`, ...[...dates].map((d) => formatDayLog(getDayLog(d)))].join("\n\n");
    }
    case "set_goals": {
      const goals = setGoals({
        calories: optNum(input.calories, "calories"),
        proteinG: optNum(input.protein_g, "protein_g"),
        carbsG: optNum(input.carbs_g, "carbs_g"),
        fatG: optNum(input.fat_g, "fat_g"),
      });
      return `Goals are now ${goals.calories} kcal, P ${goals.proteinG} g, C ${goals.carbsG} g, F ${goals.fatG} g.`;
    }
    case "get_day_log": {
      if (!isIsoDate(input.date)) throw new ToolInputError("date must be YYYY-MM-DD");
      return formatDayLog(getDayLog(input.date));
    }
    default:
      throw new ToolInputError(`Unknown tool ${name}`);
  }
}

export interface AssistantContext {
  /** The user's local date, YYYY-MM-DD. */
  today: string;
  /** The day the user has open in the app, YYYY-MM-DD. */
  viewingDate: string;
  /** The user's local time, HH:MM, used to infer which meal they mean. */
  time: string;
}

export interface AssistantResult {
  reply: string;
  /** True when any tool changed the log or goals, so the client knows to refresh. */
  changed: boolean;
}

export async function runFoodAssistant(
  history: ChatTurn[],
  context: AssistantContext
): Promise<AssistantResult> {
  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((turn) => ({
    role: turn.role,
    content: turn.text,
  }));
  messages.push({
    role: "system",
    content: [
      `Current local date and time: ${context.today} ${context.time}.`,
      context.viewingDate === context.today
        ? "The user is looking at today's log."
        : `The user is looking at the log for ${context.viewingDate}, not today.`,
      formatDayLog(getDayLog(context.viewingDate)),
    ].join("\n\n"),
  });

  let changed = false;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await getClient().beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      cache_control: { type: "ephemeral" },
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    });

    if (response.stop_reason === "refusal") {
      return { reply: "Sorry, I can't help with that one. Try rephrasing what you ate.", changed };
    }

    const text = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (response.stop_reason !== "tool_use") {
      return { reply: text || "Done.", changed };
    }

    messages.push({ role: "assistant", content: response.content });

    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      try {
        const output = runTool(block.name, (block.input ?? {}) as Record<string, unknown>);
        if (block.name !== "get_day_log") changed = true;
        results.push({ type: "tool_result", tool_use_id: block.id, content: output });
      } catch (error) {
        if (!(error instanceof ToolInputError)) throw error;
        results.push({ type: "tool_result", tool_use_id: block.id, content: error.message, is_error: true });
      }
    }
    messages.push({ role: "user", content: results });
  }

  return { reply: "That took more steps than expected. Check the log below and tell me what to fix.", changed };
}
