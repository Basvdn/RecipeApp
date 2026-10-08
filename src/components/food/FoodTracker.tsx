"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { shiftIsoDate, toLocalIsoDate } from "@/lib/nutrition/dates";
import { MEALS, type ChatTurn, type DayLog, type FoodEntry, type Macros } from "@/types/nutrition";
import { MacroSummary } from "./MacroSummary";
import { GoalsEditor } from "./GoalsEditor";
import { useSpeechInput } from "./useSpeechInput";

const CHAT_STORAGE_KEY = "food-chat-v1";
const MAX_STORED_TURNS = 40;

function loadChat(): ChatTurn[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChatTurn[]) : [];
  } catch {
    return [];
  }
}

function saveChat(turns: ChatTurn[]) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(turns.slice(-MAX_STORED_TURNS)));
  } catch {
    // Storage unavailable (private mode etc.) — chat just won't survive a reload.
  }
}

function formatDayLabel(date: string, today: string): string {
  if (date === today) return "Today";
  if (date === shiftIsoDate(today, -1)) return "Yesterday";
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function sum(entries: Macros[]) {
  return entries.reduce((acc, e) => acc + e.calories, 0);
}

const noopSubscribe = () => () => {};

/** Chat history and speech support live in the browser, so render only on the client. */
export function FoodTracker() {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return isClient ? <FoodTrackerClient /> : null;
}

function FoodTrackerClient() {
  const [today, setToday] = useState(() => toLocalIsoDate(new Date()));
  const [date, setDate] = useState(today);
  const [log, setLog] = useState<DayLog | null>(null);
  const [chat, setChat] = useState<ChatTurn[]>(loadChat);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Roll "today" over if the app stays open past midnight.
  useEffect(() => {
    const id = setInterval(() => setToday(toLocalIsoDate(new Date())), 60_000);
    return () => clearInterval(id);
  }, []);

  const refreshLog = useCallback(async (forDate: string) => {
    const res = await fetch(`/api/food/log?date=${forDate}`);
    if (res.ok) setLog((await res.json()) as DayLog);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/food/log?date=${date}`)
      .then((res) => (res.ok ? (res.json() as Promise<DayLog>) : null))
      .then((data) => {
        if (!cancelled && data) setLog(data);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat, pending]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || pending) return;
      const next: ChatTurn[] = [...chat, { role: "user", text: trimmed }];
      setChat(next);
      saveChat(next);
      setInput("");
      setError(null);
      setPending(true);
      try {
        const res = await fetch("/api/food/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: next, today: toLocalIsoDate(new Date()), viewingDate: date, time: nowTime() }),
        });
        const data = (await res.json()) as { reply?: string; changed?: boolean; error?: string };
        if (!res.ok || !data.reply) {
          setError(data.error ?? "Something went wrong.");
          return;
        }
        const withReply: ChatTurn[] = [...next, { role: "assistant", text: data.reply }];
        setChat(withReply);
        saveChat(withReply);
        if (data.changed) await refreshLog(date);
      } catch {
        setError("Couldn't reach the server.");
      } finally {
        setPending(false);
      }
    },
    [chat, date, pending, refreshLog]
  );

  const speech = useSpeechInput({ onInterim: setInput, onFinal: send });

  async function removeEntry(entry: FoodEntry) {
    await fetch(`/api/food/entries/${entry.id}`, { method: "DELETE" });
    await refreshLog(date);
  }

  function clearChat() {
    setChat([]);
    saveChat([]);
  }

  return (
    <div className="flex flex-col gap-4 pb-44">
      <header className="flex items-center justify-between">
        <button type="button" onClick={() => setDate(shiftIsoDate(date, -1))} className="px-3 py-1 text-lg" aria-label="Previous day">
          ‹
        </button>
        <h1 className="text-xl font-semibold">{formatDayLabel(date, today)}</h1>
        <button
          type="button"
          onClick={() => setDate(shiftIsoDate(date, 1))}
          disabled={date >= today}
          className="px-3 py-1 text-lg disabled:opacity-20"
          aria-label="Next day"
        >
          ›
        </button>
      </header>

      {log && <MacroSummary totals={log.totals} goals={log.goals} />}

      {log && log.entries.length > 0 && (
        <section className="flex flex-col gap-3">
          {MEALS.map((meal) => {
            const entries = log.entries.filter((e) => e.meal === meal);
            if (entries.length === 0) return null;
            return (
              <div key={meal} className="rounded-lg border p-3">
                <div className="mb-1 flex justify-between text-sm font-semibold">
                  <span className="capitalize">{meal}</span>
                  <span className="tabular-nums opacity-70">{sum(entries)} kcal</span>
                </div>
                <ul className="flex flex-col divide-y divide-foreground/10">
                  {entries.map((e) => (
                    <li key={e.id} className="flex items-center gap-2 py-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <div className="truncate">
                          {e.name}
                          {e.quantity && <span className="opacity-60"> · {e.quantity}</span>}
                        </div>
                        <div className="text-xs tabular-nums opacity-60">
                          P {e.proteinG} g · C {e.carbsG} g · F {e.fatG} g
                        </div>
                      </div>
                      <span className="tabular-nums">{e.calories}</span>
                      <button
                        type="button"
                        onClick={() => removeEntry(e)}
                        className="px-2 text-lg leading-none opacity-40 hover:opacity-100"
                        aria-label={`Remove ${e.name}`}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      )}

      {log && <GoalsEditor goals={log.goals} onSaved={() => refreshLog(date)} />}

      <section className="flex flex-col gap-2">
        {chat.length === 0 ? (
          <p className="text-sm opacity-60">
            Tell me what you ate — type it or tap the mic. For example: &ldquo;Two scrambled eggs on toast and
            a flat white for breakfast&rdquo;, &ldquo;actually make that one slice&rdquo;, or &ldquo;how much
            protein do I have left?&rdquo;
          </p>
        ) : (
          <>
            {chat.map((turn, i) => (
              <div
                key={i}
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                  turn.role === "user" ? "self-end bg-foreground text-background" : "self-start border"
                }`}
              >
                {turn.text}
              </div>
            ))}
            <button type="button" onClick={clearChat} className="self-center text-xs underline opacity-50">
              Clear conversation
            </button>
          </>
        )}
        {pending && <div className="self-start rounded-2xl border px-3 py-2 text-sm opacity-60">Thinking…</div>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div ref={chatEndRef} />
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="fixed inset-x-0 bottom-[calc(2.75rem+env(safe-area-inset-bottom))] border-t bg-background px-4 py-2"
      >
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          {speech.supported && (
            <button
              type="button"
              onClick={speech.listening ? speech.stop : speech.start}
              disabled={pending}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border disabled:opacity-40 ${
                speech.listening ? "animate-pulse bg-red-600 text-white" : ""
              }`}
              aria-label={speech.listening ? "Stop listening" : "Speak"}
            >
              <MicIcon />
            </button>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={speech.listening ? "Listening…" : "What did you eat?"}
            className="h-10 min-w-0 flex-1 rounded-full border bg-transparent px-4 text-base"
            enterKeyHint="send"
          />
          <button
            type="submit"
            disabled={pending || !input.trim()}
            className="h-10 shrink-0 rounded-full bg-foreground px-4 text-sm font-medium text-background disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v4" strokeLinecap="round" />
    </svg>
  );
}
