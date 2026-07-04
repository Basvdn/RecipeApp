import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ingredients, recipes } from "@/lib/db/schema";

export interface ShoppingListItem {
  normalizedName: string;
  displayName: string;
  contributions: { recipeTitle: string; quantity: string | null }[];
}

export function getShoppingList(): ShoppingListItem[] {
  const selectedRecipes = db.select().from(recipes).where(eq(recipes.selectedToCook, true)).all();

  const itemsByNormalizedName = new Map<string, ShoppingListItem>();

  for (const recipe of selectedRecipes) {
    const recipeIngredients = db
      .select()
      .from(ingredients)
      .where(eq(ingredients.recipeId, recipe.id))
      .orderBy(ingredients.position)
      .all();

    for (const ingredient of recipeIngredients) {
      const existing = itemsByNormalizedName.get(ingredient.normalizedName);
      const contribution = { recipeTitle: recipe.title, quantity: ingredient.quantity };

      if (existing) {
        existing.contributions.push(contribution);
      } else {
        itemsByNormalizedName.set(ingredient.normalizedName, {
          normalizedName: ingredient.normalizedName,
          displayName: ingredient.name,
          contributions: [contribution],
        });
      }
    }
  }

  return [...itemsByNormalizedName.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export function formatShoppingListAsText(items: ShoppingListItem[]): string {
  return items
    .map((item) => {
      const parts = item.contributions.map((c) => (c.quantity ? `${c.quantity} (${c.recipeTitle})` : `(${c.recipeTitle})`));
      return `${item.displayName} — ${parts.join(", ")}`;
    })
    .join("\n");
}
