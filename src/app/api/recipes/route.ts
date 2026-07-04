import { NextRequest } from "next/server";
import { createRecipe, listRecipes, type RecipeFilters } from "@/lib/repositories/recipes";
import type { RecipeInput } from "@/types/recipe";

function parseIds(value: string | null): number[] | undefined {
  if (!value) return undefined;
  return value
    .split(",")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));
}

function parseList(value: string | null): string[] | undefined {
  if (!value) return undefined;
  return value
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const filters: RecipeFilters = {
    mealTypeTagIds: parseIds(params.get("mealType")),
    foodCategoryTagIds: parseIds(params.get("foodCategory")),
    specialIngredientsOnly: params.get("specialIngredientsOnly") === "true",
    ingredientCountMin: params.get("ingredientCountMin")
      ? Number(params.get("ingredientCountMin"))
      : undefined,
    ingredientCountMax: params.get("ingredientCountMax")
      ? Number(params.get("ingredientCountMax"))
      : undefined,
    search: params.get("search") ?? undefined,
    ingredientNormalizedNames: parseList(params.get("ingredients")),
  };

  const recipes = listRecipes(filters);
  return Response.json({ recipes });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as RecipeInput;

  if (!body.title?.trim()) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }
  if (!body.ingredients || body.ingredients.length === 0) {
    return Response.json({ error: "At least one ingredient is required" }, { status: 400 });
  }

  const recipe = createRecipe(body);
  return Response.json({ recipe }, { status: 201 });
}
