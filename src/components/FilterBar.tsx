"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IngredientPicker } from "@/components/IngredientPicker";
import type { DistinctIngredient } from "@/lib/repositories/ingredients";
import type { Tag } from "@/types/recipe";

interface Props {
  allTags: Tag[];
  allIngredients: DistinctIngredient[];
  initial: {
    search: string;
    mealTypeTagIds: number[];
    foodCategoryTagIds: number[];
    ingredientNormalizedNames: string[];
    specialIngredientsOnly: boolean;
    ingredientCountBucket: string;
  };
}

const INGREDIENT_COUNT_BUCKETS: { value: string; label: string; min?: number; max?: number }[] = [
  { value: "", label: "Any" },
  { value: "small", label: "≤5", max: 5 },
  { value: "medium", label: "6-10", min: 6, max: 10 },
  { value: "large", label: "10+", min: 11 },
];

export function FilterBar({ allTags, allIngredients, initial }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(initial.search);
  const [mealTypeTagIds, setMealTypeTagIds] = useState(initial.mealTypeTagIds);
  const [foodCategoryTagIds, setFoodCategoryTagIds] = useState(initial.foodCategoryTagIds);
  const [ingredientNames, setIngredientNames] = useState(initial.ingredientNormalizedNames);
  const [specialOnly, setSpecialOnly] = useState(initial.specialIngredientsOnly);
  const [countBucket, setCountBucket] = useState(initial.ingredientCountBucket);
  const [open, setOpen] = useState(false);

  function apply(next: {
    search?: string;
    mealTypeTagIds?: number[];
    foodCategoryTagIds?: number[];
    ingredientNames?: string[];
    specialOnly?: boolean;
    countBucket?: string;
  }) {
    const params = new URLSearchParams();
    const s = next.search ?? search;
    const mt = next.mealTypeTagIds ?? mealTypeTagIds;
    const fc = next.foodCategoryTagIds ?? foodCategoryTagIds;
    const ing = next.ingredientNames ?? ingredientNames;
    const special = next.specialOnly ?? specialOnly;
    const bucket = next.countBucket ?? countBucket;

    if (s) params.set("search", s);
    if (mt.length) params.set("mealType", mt.join(","));
    if (fc.length) params.set("foodCategory", fc.join(","));
    if (ing.length) params.set("ingredients", ing.join(","));
    if (special) params.set("specialIngredientsOnly", "true");
    if (bucket) params.set("ingredientCount", bucket);

    router.push(`/library${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function toggleTag(list: number[], setList: (ids: number[]) => void, tagId: number, key: "mealTypeTagIds" | "foodCategoryTagIds") {
    const next = list.includes(tagId) ? list.filter((id) => id !== tagId) : [...list, tagId];
    setList(next);
    apply({ [key]: next });
  }

  const activeCount =
    (search ? 1 : 0) +
    mealTypeTagIds.length +
    foodCategoryTagIds.length +
    ingredientNames.length +
    (specialOnly ? 1 : 0) +
    (countBucket ? 1 : 0);

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply({ search })}
          onBlur={() => apply({ search })}
          placeholder="Search title or ingredients…"
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <button type="button" onClick={() => setOpen((o) => !o)} className="rounded border px-3 py-2 text-sm">
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Meal type</span>
            <div className="flex flex-wrap gap-2">
              {allTags
                .filter((t) => t.category === "meal_type")
                .map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(mealTypeTagIds, setMealTypeTagIds, tag.id, "mealTypeTagIds")}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      mealTypeTagIds.includes(tag.id) ? "bg-foreground text-background" : ""
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Food category</span>
            <div className="flex flex-wrap gap-2">
              {allTags
                .filter((t) => t.category === "food_category")
                .map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(foodCategoryTagIds, setFoodCategoryTagIds, tag.id, "foodCategoryTagIds")}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      foodCategoryTagIds.includes(tag.id) ? "bg-foreground text-background" : ""
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Number of ingredients</span>
            <div className="flex flex-wrap gap-2">
              {INGREDIENT_COUNT_BUCKETS.map((bucket) => (
                <button
                  key={bucket.value}
                  type="button"
                  onClick={() => {
                    setCountBucket(bucket.value);
                    apply({ countBucket: bucket.value });
                  }}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    countBucket === bucket.value ? "bg-foreground text-background" : ""
                  }`}
                >
                  {bucket.label}
                </button>
              ))}
            </div>
          </div>

          <IngredientPicker
            label="Contains ingredient"
            allIngredients={allIngredients}
            selectedNormalizedNames={ingredientNames}
            onChange={(names) => {
              setIngredientNames(names);
              apply({ ingredientNames: names });
            }}
          />

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={specialOnly}
              onChange={(e) => {
                setSpecialOnly(e.target.checked);
                apply({ specialOnly: e.target.checked });
              }}
            />
            Only recipes needing specialty-shop ingredients
          </label>
        </div>
      )}
    </div>
  );
}
