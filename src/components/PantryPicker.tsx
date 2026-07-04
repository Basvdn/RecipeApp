"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IngredientPicker } from "@/components/IngredientPicker";
import type { DistinctIngredient } from "@/lib/repositories/ingredients";

export function PantryPicker({
  allIngredients,
  initialSelected,
}: {
  allIngredients: DistinctIngredient[];
  initialSelected: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(initialSelected);

  function onChange(names: string[]) {
    setSelected(names);
    const params = new URLSearchParams();
    if (names.length > 0) params.set("have", names.join(","));
    router.push(`/pantry${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <IngredientPicker
      label="Ingredients you have"
      allIngredients={allIngredients}
      selectedNormalizedNames={selected}
      onChange={onChange}
    />
  );
}
