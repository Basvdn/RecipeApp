"use client";

import { useState } from "react";
import type { NutritionGoals } from "@/types/nutrition";

const FIELDS = [
  { key: "calories", label: "Calories (kcal)" },
  { key: "proteinG", label: "Protein (g)" },
  { key: "carbsG", label: "Carbs (g)" },
  { key: "fatG", label: "Fat (g)" },
] as const;

export function GoalsEditor({ goals, onSaved }: { goals: NutritionGoals; onSaved: () => void }) {
  const [draft, setDraft] = useState<Record<keyof NutritionGoals, string> | null>(null);
  const [saving, setSaving] = useState(false);

  function open() {
    setDraft({
      calories: String(goals.calories),
      proteinG: String(goals.proteinG),
      carbsG: String(goals.carbsG),
      fatG: String(goals.fatG),
    });
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    try {
      const body = Object.fromEntries(
        FIELDS.map(({ key }) => [key, Number(draft[key])]).filter(([, v]) => Number.isFinite(v))
      );
      await fetch("/api/food/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setDraft(null);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  if (!draft) {
    return (
      <button type="button" onClick={open} className="self-start text-sm underline opacity-60">
        Edit daily goals
      </button>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="text-sm font-semibold">Daily goals</h2>
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(({ key, label }) => (
          <label key={key} className="flex flex-col gap-1 text-xs">
            <span className="opacity-70">{label}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={draft[key]}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              className="rounded border bg-transparent px-2 py-1 text-base"
            />
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          Save
        </button>
        <button type="button" onClick={() => setDraft(null)} className="rounded border px-4 py-2 text-sm">
          Cancel
        </button>
      </div>
    </section>
  );
}
