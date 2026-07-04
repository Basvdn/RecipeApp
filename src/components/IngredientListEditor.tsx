"use client";

import type { IngredientInput } from "@/types/recipe";

interface Props {
  ingredients: IngredientInput[];
  onChange: (ingredients: IngredientInput[]) => void;
}

export function IngredientListEditor({ ingredients, onChange }: Props) {
  function updateRow(index: number, patch: Partial<IngredientInput>) {
    const next = ingredients.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  }

  function removeRow(index: number) {
    onChange(ingredients.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...ingredients, { rawText: "", quantity: "", name: "" }]);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Ingredients</label>
      {ingredients.map((row, index) => (
        <div key={index} className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Amount (e.g. 200g)"
            value={row.quantity ?? ""}
            onChange={(e) => {
              const quantity = e.target.value;
              updateRow(index, { quantity, rawText: `${quantity} ${row.name}`.trim() });
            }}
            className="w-32 rounded border px-2 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Ingredient name (e.g. penne)"
            value={row.name}
            onChange={(e) => {
              const name = e.target.value;
              updateRow(index, { name, rawText: `${row.quantity ?? ""} ${name}`.trim() });
            }}
            className="flex-1 rounded border px-2 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => removeRow(index)}
            aria-label="Remove ingredient"
            className="shrink-0 rounded border px-3 py-2 text-sm"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="self-start rounded border px-3 py-2 text-sm"
      >
        + Add ingredient
      </button>
    </div>
  );
}
