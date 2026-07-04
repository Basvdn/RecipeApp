import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import { RecipeCard } from "@/components/RecipeCard";
import { listDistinctIngredients } from "@/lib/repositories/ingredients";
import { listRecipes } from "@/lib/repositories/recipes";
import { listTags } from "@/lib/repositories/tags";

function parseIds(value: string | undefined): number[] {
  if (!value) return [];
  return value
    .split(",")
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const asString = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const search = asString(params.search) ?? "";
  const mealTypeTagIds = parseIds(asString(params.mealType));
  const foodCategoryTagIds = parseIds(asString(params.foodCategory));
  const ingredientNormalizedNames = parseList(asString(params.ingredients));
  const specialIngredientsOnly = asString(params.specialIngredientsOnly) === "true";
  const ingredientCountBucket = asString(params.ingredientCount) ?? "";

  const countRange: Record<string, { min?: number; max?: number }> = {
    small: { max: 5 },
    medium: { min: 6, max: 10 },
    large: { min: 11 },
  };
  const bucketRange = countRange[ingredientCountBucket];

  const recipes = listRecipes({
    search: search || undefined,
    mealTypeTagIds,
    foodCategoryTagIds,
    ingredientNormalizedNames,
    specialIngredientsOnly,
    ingredientCountMin: bucketRange?.min,
    ingredientCountMax: bucketRange?.max,
  });
  const allTags = listTags();
  const allIngredients = listDistinctIngredients();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Library</h1>
        <div className="flex gap-3 text-sm">
          <Link href="/pantry" className="underline">
            What can I cook?
          </Link>
          <Link href="/recipes/new" className="underline">
            + Add recipe
          </Link>
        </div>
      </div>

      <FilterBar
        allTags={allTags}
        allIngredients={allIngredients}
        initial={{
          search,
          mealTypeTagIds,
          foodCategoryTagIds,
          ingredientNormalizedNames,
          specialIngredientsOnly,
          ingredientCountBucket,
        }}
      />

      {recipes.length === 0 ? (
        <p className="opacity-70">No recipes match these filters.</p>
      ) : (
        <div className="flex flex-col gap-3 pb-20">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
