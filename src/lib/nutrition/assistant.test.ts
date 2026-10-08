import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Point the DB client at a throwaway file before anything imports it.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "food-log-test-"));
process.env.DATABASE_PATH = path.join(tmpDir, "test.db");

// Scripted Claude: each test queues the responses the fake API returns, in order.
const create = vi.fn();
vi.mock("@anthropic-ai/sdk", () => {
  class APIError extends Error {}
  class Anthropic {
    static APIError = APIError;
    beta = { messages: { create } };
  }
  return { default: Anthropic };
});

type Block = Record<string, unknown>;
const reply = (content: Block[], stop_reason = "end_turn") => ({ content, stop_reason });
const toolUse = (id: string, name: string, input: unknown): Block => ({ type: "tool_use", id, name, input });
const text = (t: string): Block => ({ type: "text", text: t });

let runFoodAssistant: typeof import("./assistant").runFoodAssistant;
let repo: typeof import("@/lib/repositories/foodLog");

beforeAll(async () => {
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  const { db } = await import("@/lib/db/client");
  migrate(db, { migrationsFolder: path.join(process.cwd(), "src/lib/db/migrations") });
  ({ runFoodAssistant } = await import("./assistant"));
  repo = await import("@/lib/repositories/foodLog");
});

beforeEach(async () => {
  create.mockReset();
  const { db } = await import("@/lib/db/client");
  const { foodEntries, nutritionGoals } = await import("@/lib/db/schema");
  db.delete(foodEntries).run();
  db.delete(nutritionGoals).run();
});

const ctx = { today: "2026-10-08", viewingDate: "2026-10-08", time: "08:15" };

describe("runFoodAssistant", () => {
  it("logs foods from a tool call and returns Claude's final reply", async () => {
    create
      .mockResolvedValueOnce(
        reply(
          [
            toolUse("t1", "log_foods", {
              items: [
                { name: "Scrambled eggs", quantity: "2 large", meal: "breakfast", date: "2026-10-08", calories: 182, protein_g: 12.4, carbs_g: 2, fat_g: 13.6 },
                { name: "Flat white", quantity: "1 small", meal: "breakfast", date: "2026-10-08", calories: 110, protein_g: 6, carbs_g: 9, fat_g: 6 },
              ],
            }),
          ],
          "tool_use"
        )
      )
      .mockResolvedValueOnce(reply([text("Logged eggs (182 kcal) and a flat white (110 kcal). 292 / 2000 kcal today.")]));

    const result = await runFoodAssistant([{ role: "user", text: "two eggs and a flat white" }], ctx);

    expect(result).toEqual({ reply: "Logged eggs (182 kcal) and a flat white (110 kcal). 292 / 2000 kcal today.", changed: true });
    const log = repo.getDayLog("2026-10-08");
    expect(log.entries.map((e) => e.name)).toEqual(["Scrambled eggs", "Flat white"]);
    expect(log.totals).toEqual({ calories: 292, proteinG: 18, carbsG: 11, fatG: 20 });

    // Second request carries the tool result back, and the day's context went in as a system message.
    const secondCall = create.mock.calls[1][0];
    const contextMsg = secondCall.messages[1];
    expect(contextMsg.role).toBe("system");
    expect(contextMsg.content).toContain("Current local date and time: 2026-10-08 08:15");
    const toolResult = secondCall.messages.at(-1).content[0];
    expect(toolResult).toMatchObject({ type: "tool_result", tool_use_id: "t1" });
    expect(toolResult.is_error).toBeUndefined();
  });

  it("returns invalid tool input to Claude as an error instead of writing it", async () => {
    create
      .mockResolvedValueOnce(
        reply([toolUse("t1", "log_foods", { items: [{ name: "Toast", meal: "brunch", date: "2026-10-08", calories: 80, protein_g: 3, carbs_g: 15, fat_g: 1 }] })], "tool_use")
      )
      .mockResolvedValueOnce(reply([text("Logged.")]));

    const result = await runFoodAssistant([{ role: "user", text: "toast" }], ctx);

    expect(result.changed).toBe(false);
    expect(repo.listEntriesForDate("2026-10-08")).toHaveLength(0);
    const toolResult = create.mock.calls[1][0].messages.at(-1).content[0];
    expect(toolResult.is_error).toBe(true);
    expect(toolResult.content).toMatch(/meal must be one of/);
  });

  it("updates, deletes, and sets goals", async () => {
    const [banana, bar] = repo.addEntries([
      { date: "2026-10-08", meal: "snack", name: "Banana", quantity: "1", calories: 105, proteinG: 1, carbsG: 27, fatG: 0 },
      { date: "2026-10-08", meal: "snack", name: "Protein bar", quantity: "1", calories: 200, proteinG: 20, carbsG: 20, fatG: 7 },
    ]);
    create
      .mockResolvedValueOnce(
        reply(
          [
            toolUse("a", "update_entry", { id: banana.id, quantity: "2", calories: 210, carbs_g: 54, protein_g: 2 }),
            toolUse("b", "delete_entries", { ids: [bar.id] }),
            toolUse("c", "set_goals", { protein_g: 160 }),
          ],
          "tool_use"
        )
      )
      .mockResolvedValueOnce(reply([text("Done.")]));

    await runFoodAssistant([{ role: "user", text: "two bananas, no bar, goal 160 g protein" }], ctx);

    const log = repo.getDayLog("2026-10-08");
    expect(log.entries).toHaveLength(1);
    expect(log.entries[0]).toMatchObject({ name: "Banana", quantity: "2", calories: 210, carbsG: 54 });
    expect(log.goals).toEqual({ ...repo.DEFAULT_GOALS, proteinG: 160 });
    // All three results go back in one user message.
    expect(create.mock.calls[1][0].messages.at(-1).content).toHaveLength(3);
  });

  it("handles a refusal without reading content", async () => {
    create.mockResolvedValueOnce({ content: [], stop_reason: "refusal" });
    const result = await runFoodAssistant([{ role: "user", text: "hi" }], ctx);
    expect(result.changed).toBe(false);
    expect(result.reply).toMatch(/can't help/);
  });
});
