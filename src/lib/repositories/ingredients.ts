import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ingredients } from "@/lib/db/schema";

export interface DistinctIngredient {
  normalizedName: string;
  displayName: string;
}

export function listDistinctIngredients(): DistinctIngredient[] {
  const rows = db
    .select({
      normalizedName: ingredients.normalizedName,
      displayName: sql<string>`min(${ingredients.name})`,
    })
    .from(ingredients)
    .groupBy(ingredients.normalizedName)
    .orderBy(ingredients.normalizedName)
    .all();

  return rows;
}
