import { and, eq, inArray, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ingredients, photos, recipeTags, recipes, tags } from "@/lib/db/schema";
import { normalizeIngredientName } from "@/lib/ocr/normalize-ingredient-name";
import type { Recipe, RecipeInput, RecipePantryMatch } from "@/types/recipe";

export interface RecipeFilters {
  mealTypeTagIds?: number[];
  foodCategoryTagIds?: number[];
  specialIngredientsOnly?: boolean;
  ingredientCountMax?: number;
  ingredientCountMin?: number;
  search?: string;
  ingredientNormalizedNames?: string[];
}

function loadRecipe(recipeId: number): Recipe {
  const recipeRow = db.select().from(recipes).where(eq(recipes.id, recipeId)).get();
  if (!recipeRow) {
    throw new Error(`Recipe ${recipeId} not found`);
  }

  const ingredientRows = db
    .select()
    .from(ingredients)
    .where(eq(ingredients.recipeId, recipeId))
    .orderBy(ingredients.position)
    .all();

  const tagRows = db
    .select({ id: tags.id, category: tags.category, name: tags.name })
    .from(recipeTags)
    .innerJoin(tags, eq(recipeTags.tagId, tags.id))
    .where(eq(recipeTags.recipeId, recipeId))
    .all();

  const photoRows = db
    .select({ id: photos.id, storageKey: photos.storageKey, position: photos.position })
    .from(photos)
    .where(eq(photos.recipeId, recipeId))
    .orderBy(photos.position)
    .all();

  return {
    ...recipeRow,
    ingredients: ingredientRows,
    tags: tagRows,
    photos: photoRows,
  };
}

export function createRecipe(input: RecipeInput): Recipe {
  const recipeId = db.transaction((tx) => {
    const inserted = tx
      .insert(recipes)
      .values({
        title: input.title,
        sourceText: input.sourceText ?? null,
        prepTimeMinutes: input.prepTimeMinutes ?? null,
        cookTimeMinutes: input.cookTimeMinutes ?? null,
        totalTimeMinutes: input.totalTimeMinutes ?? null,
        ocrRawText: input.ocrRawText ?? null,
        hasSpecialIngredients: input.hasSpecialIngredients,
      })
      .returning({ id: recipes.id })
      .get();

    input.ingredients.forEach((ingredient, position) => {
      tx.insert(ingredients)
        .values({
          recipeId: inserted.id,
          position,
          rawText: ingredient.rawText,
          quantity: ingredient.quantity ?? null,
          unit: ingredient.unit ?? null,
          name: ingredient.name,
          normalizedName: normalizeIngredientName(ingredient.name),
        })
        .run();
    });

    if (input.tagIds.length > 0) {
      tx.insert(recipeTags)
        .values(input.tagIds.map((tagId) => ({ recipeId: inserted.id, tagId })))
        .run();
    }

    input.photoStorageKeys?.forEach((storageKey, position) => {
      tx.insert(photos).values({ recipeId: inserted.id, storageKey, position }).run();
    });

    return inserted.id;
  });

  return loadRecipe(recipeId);
}

export function updateRecipe(recipeId: number, input: RecipeInput): Recipe {
  db.transaction((tx) => {
    tx.update(recipes)
      .set({
        title: input.title,
        sourceText: input.sourceText ?? null,
        prepTimeMinutes: input.prepTimeMinutes ?? null,
        cookTimeMinutes: input.cookTimeMinutes ?? null,
        totalTimeMinutes: input.totalTimeMinutes ?? null,
        ocrRawText: input.ocrRawText ?? null,
        hasSpecialIngredients: input.hasSpecialIngredients,
        updatedAt: sql`(current_timestamp)`,
      })
      .where(eq(recipes.id, recipeId))
      .run();

    tx.delete(ingredients).where(eq(ingredients.recipeId, recipeId)).run();
    input.ingredients.forEach((ingredient, position) => {
      tx.insert(ingredients)
        .values({
          recipeId,
          position,
          rawText: ingredient.rawText,
          quantity: ingredient.quantity ?? null,
          unit: ingredient.unit ?? null,
          name: ingredient.name,
          normalizedName: normalizeIngredientName(ingredient.name),
        })
        .run();
    });

    tx.delete(recipeTags).where(eq(recipeTags.recipeId, recipeId)).run();
    if (input.tagIds.length > 0) {
      tx.insert(recipeTags)
        .values(input.tagIds.map((tagId) => ({ recipeId, tagId })))
        .run();
    }
  });

  return loadRecipe(recipeId);
}

export function getRecipe(recipeId: number): Recipe | null {
  try {
    return loadRecipe(recipeId);
  } catch {
    return null;
  }
}

export function deleteRecipe(recipeId: number): void {
  db.delete(recipes).where(eq(recipes.id, recipeId)).run();
}

export function setSelectedToCook(recipeId: number, selected: boolean): Recipe {
  db.update(recipes)
    .set({
      selectedToCook: selected,
      selectedAt: selected ? new Date().toISOString() : null,
      updatedAt: sql`(current_timestamp)`,
    })
    .where(eq(recipes.id, recipeId))
    .run();

  return loadRecipe(recipeId);
}

export function listRecipes(filters: RecipeFilters = {}): Recipe[] {
  const conditions = [];

  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    const matchingIngredientRecipeIds = db
      .selectDistinct({ recipeId: ingredients.recipeId })
      .from(ingredients)
      .where(like(sql`lower(${ingredients.name})`, term))
      .all()
      .map((row) => row.recipeId);

    conditions.push(
      or(
        like(sql`lower(${recipes.title})`, term),
        matchingIngredientRecipeIds.length > 0
          ? inArray(recipes.id, matchingIngredientRecipeIds)
          : sql`0`
      )
    );
  }

  if (filters.specialIngredientsOnly) {
    conditions.push(eq(recipes.hasSpecialIngredients, true));
  }

  if (filters.ingredientNormalizedNames && filters.ingredientNormalizedNames.length > 0) {
    const matchingRecipeIds = db
      .selectDistinct({ recipeId: ingredients.recipeId })
      .from(ingredients)
      .where(inArray(ingredients.normalizedName, filters.ingredientNormalizedNames))
      .all()
      .map((row) => row.recipeId);
    conditions.push(matchingRecipeIds.length > 0 ? inArray(recipes.id, matchingRecipeIds) : sql`0`);
  }

  for (const tagIds of [filters.mealTypeTagIds, filters.foodCategoryTagIds]) {
    if (tagIds && tagIds.length > 0) {
      const matchingRecipeIds = db
        .selectDistinct({ recipeId: recipeTags.recipeId })
        .from(recipeTags)
        .where(inArray(recipeTags.tagId, tagIds))
        .all()
        .map((row) => row.recipeId);
      conditions.push(matchingRecipeIds.length > 0 ? inArray(recipes.id, matchingRecipeIds) : sql`0`);
    }
  }

  const rows = db
    .select()
    .from(recipes)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${recipes.createdAt} desc`)
    .all();

  let result = rows.map((row) => loadRecipe(row.id));

  if (filters.ingredientCountMin !== undefined) {
    result = result.filter((r) => r.ingredients.length >= filters.ingredientCountMin!);
  }
  if (filters.ingredientCountMax !== undefined) {
    result = result.filter((r) => r.ingredients.length <= filters.ingredientCountMax!);
  }

  return result;
}

export function matchRecipesByPantry(haveNormalizedNames: string[]): RecipePantryMatch[] {
  const haveSet = new Set(haveNormalizedNames);

  const matches = listRecipes().map((recipe): RecipePantryMatch => {
    const missingIngredientNames = recipe.ingredients
      .filter((ingredient) => !haveSet.has(ingredient.normalizedName))
      .map((ingredient) => ingredient.name);

    return {
      recipe,
      missingIngredientNames,
      matchedCount: recipe.ingredients.length - missingIngredientNames.length,
      totalCount: recipe.ingredients.length,
    };
  });

  matches.sort((a, b) => a.missingIngredientNames.length - b.missingIngredientNames.length);

  return matches;
}
