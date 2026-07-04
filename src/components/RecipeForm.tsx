"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IngredientListEditor } from "@/components/IngredientListEditor";
import { TagPicker } from "@/components/TagPicker";
import type { IngredientInput, RecipeInput, Tag } from "@/types/recipe";

interface Props {
  allTags: Tag[];
  recipeId?: number;
  initialValues?: Partial<RecipeInput>;
  photoStorageKeys?: string[];
}

export function RecipeForm({ allTags: initialAllTags, recipeId, initialValues, photoStorageKeys }: Props) {
  const router = useRouter();
  const [allTags, setAllTags] = useState(initialAllTags);
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [sourceText, setSourceText] = useState(initialValues?.sourceText ?? "");
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(
    initialValues?.prepTimeMinutes?.toString() ?? ""
  );
  const [cookTimeMinutes, setCookTimeMinutes] = useState(
    initialValues?.cookTimeMinutes?.toString() ?? ""
  );
  const [totalTimeMinutes, setTotalTimeMinutes] = useState(
    initialValues?.totalTimeMinutes?.toString() ?? ""
  );
  const [hasSpecialIngredients, setHasSpecialIngredients] = useState(
    initialValues?.hasSpecialIngredients ?? false
  );
  const [ingredients, setIngredients] = useState<IngredientInput[]>(
    initialValues?.ingredients?.length ? initialValues.ingredients : [{ rawText: "", quantity: "", name: "" }]
  );
  const [mealTypeTagIds, setMealTypeTagIds] = useState<number[]>(
    initialValues?.tagIds?.filter((id) => allTags.some((t) => t.id === id && t.category === "meal_type")) ?? []
  );
  const [foodCategoryTagIds, setFoodCategoryTagIds] = useState<number[]>(
    initialValues?.tagIds?.filter((id) => allTags.some((t) => t.id === id && t.category === "food_category")) ?? []
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanedIngredients = ingredients
      .map((ing) => ({ ...ing, name: ing.name.trim() }))
      .filter((ing) => ing.name.length > 0);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (cleanedIngredients.length === 0) {
      setError("At least one ingredient is required");
      return;
    }

    const payload: RecipeInput = {
      title: title.trim(),
      sourceText: sourceText.trim() || null,
      prepTimeMinutes: prepTimeMinutes ? Number(prepTimeMinutes) : null,
      cookTimeMinutes: cookTimeMinutes ? Number(cookTimeMinutes) : null,
      totalTimeMinutes: totalTimeMinutes ? Number(totalTimeMinutes) : null,
      ocrRawText: initialValues?.ocrRawText ?? null,
      hasSpecialIngredients,
      ingredients: cleanedIngredients,
      tagIds: [...mealTypeTagIds, ...foodCategoryTagIds],
      photoStorageKeys,
    };

    setSubmitting(true);
    try {
      const res = await fetch(recipeId ? `/api/recipes/${recipeId}` : "/api/recipes", {
        method: recipeId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Failed to save recipe");
        return;
      }
      const { recipe } = await res.json();
      router.push(`/recipes/${recipe.id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-24">
      {error && <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-800">{error}</p>}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded border px-3 py-2"
          placeholder="Coconut macaroons"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Source</label>
        <input
          type="text"
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          className="rounded border px-3 py-2"
          placeholder="e.g. Jamie Oliver – 5 Ingredients, p.84"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Prep (min)</label>
          <input
            type="number"
            min={0}
            value={prepTimeMinutes}
            onChange={(e) => setPrepTimeMinutes(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Cook (min)</label>
          <input
            type="number"
            min={0}
            value={cookTimeMinutes}
            onChange={(e) => setCookTimeMinutes(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Total (min)</label>
          <input
            type="number"
            min={0}
            value={totalTimeMinutes}
            onChange={(e) => setTotalTimeMinutes(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </div>
      </div>

      <IngredientListEditor ingredients={ingredients} onChange={setIngredients} />

      <TagPicker
        label="Meal type"
        category="meal_type"
        allTags={allTags}
        selectedTagIds={mealTypeTagIds}
        onChange={setMealTypeTagIds}
        onTagCreated={(tag) => setAllTags((prev) => [...prev, tag])}
      />

      <TagPicker
        label="Food category"
        category="food_category"
        allTags={allTags}
        selectedTagIds={foodCategoryTagIds}
        onChange={setFoodCategoryTagIds}
        onTagCreated={(tag) => setAllTags((prev) => [...prev, tag])}
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={hasSpecialIngredients}
          onChange={(e) => setHasSpecialIngredients(e.target.checked)}
        />
        Needs ingredients from a specialty shop (not a regular supermarket)
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-foreground px-4 py-3 font-medium text-background disabled:opacity-50"
      >
        {submitting ? "Saving…" : recipeId ? "Save changes" : "Save recipe"}
      </button>
    </form>
  );
}
