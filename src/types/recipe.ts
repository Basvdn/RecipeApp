export type TagCategory = "meal_type" | "food_category";

export interface Tag {
  id: number;
  category: TagCategory;
  name: string;
}

export interface IngredientInput {
  rawText: string;
  quantity?: string | null;
  unit?: string | null;
  name: string;
}

export interface RecipeInput {
  title: string;
  sourceText?: string | null;
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  totalTimeMinutes?: number | null;
  ocrRawText?: string | null;
  hasSpecialIngredients: boolean;
  ingredients: IngredientInput[];
  tagIds: number[];
  photoStorageKeys?: string[];
}

export interface Recipe {
  id: number;
  title: string;
  sourceText: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  totalTimeMinutes: number | null;
  ocrRawText: string | null;
  hasSpecialIngredients: boolean;
  selectedToCook: boolean;
  selectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ingredients: {
    id: number;
    position: number;
    rawText: string;
    quantity: string | null;
    unit: string | null;
    name: string;
    normalizedName: string;
  }[];
  tags: Tag[];
  photos: { id: number; storageKey: string; position: number }[];
}

export interface RecipePantryMatch {
  recipe: Recipe;
  missingIngredientNames: string[];
  matchedCount: number;
  totalCount: number;
}
