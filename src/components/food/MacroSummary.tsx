import type { Macros, NutritionGoals } from "@/types/nutrition";

function Bar({ value, goal }: { value: number; goal: number }) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  const over = goal > 0 && value > goal;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/10">
      <div
        className={`h-full rounded-full ${over ? "bg-red-600" : "bg-foreground"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const MACROS = [
  { key: "proteinG", label: "Protein" },
  { key: "carbsG", label: "Carbs" },
  { key: "fatG", label: "Fat" },
] as const;

export function MacroSummary({ totals, goals }: { totals: Macros; goals: NutritionGoals }) {
  const remaining = goals.calories - totals.calories;

  return (
    <section className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-semibold tabular-nums">{totals.calories}</span>
          <span className="text-sm tabular-nums opacity-70">
            {remaining >= 0 ? `${remaining} kcal left` : `${-remaining} kcal over`} · goal {goals.calories}
          </span>
        </div>
        <Bar value={totals.calories} goal={goals.calories} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {MACROS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1">
            <span className="text-xs opacity-70">{label}</span>
            <span className="text-sm font-medium tabular-nums">
              {totals[key]}
              <span className="opacity-60"> / {goals[key]} g</span>
            </span>
            <Bar value={totals[key]} goal={goals[key]} />
          </div>
        ))}
      </div>
    </section>
  );
}
