"use client";

import { useMemo, useState } from "react";
import type { DistinctIngredient } from "@/lib/repositories/ingredients";

interface Props {
  label: string;
  allIngredients: DistinctIngredient[];
  selectedNormalizedNames: string[];
  onChange: (normalizedNames: string[]) => void;
  maxVisible?: number;
}

export function IngredientPicker({
  label,
  allIngredients,
  selectedNormalizedNames,
  onChange,
  maxVisible = 30,
}: Props) {
  const [query, setQuery] = useState("");

  const selected = allIngredients.filter((i) => selectedNormalizedNames.includes(i.normalizedName));
  const unselectedMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allIngredients
      .filter((i) => !selectedNormalizedNames.includes(i.normalizedName))
      .filter((i) => (q ? i.displayName.toLowerCase().includes(q) : true))
      .slice(0, maxVisible);
  }, [allIngredients, query, selectedNormalizedNames, maxVisible]);

  function toggle(normalizedName: string) {
    if (selectedNormalizedNames.includes(normalizedName)) {
      onChange(selectedNormalizedNames.filter((n) => n !== normalizedName));
    } else {
      onChange([...selectedNormalizedNames, normalizedName]);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{label}</label>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((i) => (
            <button
              key={i.normalizedName}
              type="button"
              onClick={() => toggle(i.normalizedName)}
              className="rounded-full border bg-foreground px-3 py-1 text-sm text-background"
            >
              {i.displayName} ✕
            </button>
          ))}
        </div>
      )}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search ingredients…"
        className="rounded border px-2 py-2 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        {unselectedMatches.map((i) => (
          <button
            key={i.normalizedName}
            type="button"
            onClick={() => toggle(i.normalizedName)}
            className="rounded-full border px-3 py-1 text-sm"
          >
            {i.displayName}
          </button>
        ))}
      </div>
    </div>
  );
}
