import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { runFoodAssistant } from "@/lib/nutrition/assistant";
import { isIsoDate } from "@/lib/nutrition/dates";
import type { ChatTurn } from "@/types/nutrition";

const MAX_TURNS = 20;

function isChatTurn(value: unknown): value is ChatTurn {
  const turn = value as ChatTurn;
  return (
    !!turn &&
    (turn.role === "user" || turn.role === "assistant") &&
    typeof turn.text === "string" &&
    turn.text.trim().length > 0
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    messages?: unknown;
    today?: unknown;
    viewingDate?: unknown;
    time?: unknown;
  };

  if (!Array.isArray(body.messages) || !body.messages.every(isChatTurn)) {
    return Response.json({ error: "messages must be a list of {role, text}" }, { status: 400 });
  }
  if (!isIsoDate(body.today) || !isIsoDate(body.viewingDate) || typeof body.time !== "string") {
    return Response.json(
      { error: "today and viewingDate (YYYY-MM-DD) and time (HH:MM) are required" },
      { status: 400 }
    );
  }

  // Keep the conversation short and make sure it starts with a user turn.
  let history = body.messages.slice(-MAX_TURNS);
  while (history.length && history[0].role !== "user") history = history.slice(1);
  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return Response.json({ error: "The last message must be from the user" }, { status: 400 });
  }

  try {
    const result = await runFoodAssistant(history, {
      today: body.today,
      viewingDate: body.viewingDate,
      time: body.time,
    });
    return Response.json(result);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: "The Claude API key is missing or invalid (set ANTHROPIC_API_KEY)." }, { status: 500 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "Rate limited by the Claude API. Try again in a moment." }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Claude API error", error.status, error.message);
      return Response.json({ error: `Claude API error (${error.status ?? "network"}).` }, { status: 502 });
    }
    if (error instanceof Error && /api key|apiKey|authToken/i.test(error.message)) {
      return Response.json({ error: "No Claude API key configured. Set ANTHROPIC_API_KEY in .env.local." }, { status: 500 });
    }
    throw error;
  }
}
