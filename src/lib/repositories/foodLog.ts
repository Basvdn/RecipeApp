import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { foodEntries, nutritionGoals } from "@/lib/db/schema";
import type { DayLog, FoodEntry, FoodEntryInput, Macros, NutritionGoals } from "@/types/nutrition";

export const DEFAULT_GOALS: NutritionGoals = { calories: 2000, proteinG: 150, carbsG: 200, fatG: 65 };

const round = (n: number) => Math.max(0, Math.round(n));

export function listEntriesForDate(date: string): FoodEntry[] {
  return db
    .select()
    .from(foodEntries)
    .where(eq(foodEntries.date, date))
    .orderBy(foodEntries.createdAt, foodEntries.id)
    .all();
}

export function addEntries(inputs: FoodEntryInput[]): FoodEntry[] {
  if (inputs.length === 0) return [];
  return db
    .insert(foodEntries)
    .values(
      inputs.map((i) => ({
        date: i.date,
        meal: i.meal,
        name: i.name.trim(),
        quantity: i.quantity?.trim() || null,
        calories: round(i.calories),
        proteinG: round(i.proteinG),
        carbsG: round(i.carbsG),
        fatG: round(i.fatG),
      }))
    )
    .returning()
    .all();
}

export function updateEntry(
  id: number,
  changes: Partial<Omit<FoodEntryInput, "date">>
): FoodEntry | undefined {
  const patch: Partial<typeof foodEntries.$inferInsert> = {};
  if (changes.meal) patch.meal = changes.meal;
  if (changes.name) patch.name = changes.name.trim();
  if (changes.quantity !== undefined) patch.quantity = changes.quantity?.trim() || null;
  if (changes.calories !== undefined) patch.calories = round(changes.calories);
  if (changes.proteinG !== undefined) patch.proteinG = round(changes.proteinG);
  if (changes.carbsG !== undefined) patch.carbsG = round(changes.carbsG);
  if (changes.fatG !== undefined) patch.fatG = round(changes.fatG);
  if (Object.keys(patch).length === 0) return getEntry(id);
  return db.update(foodEntries).set(patch).where(eq(foodEntries.id, id)).returning().get();
}

export function getEntry(id: number): FoodEntry | undefined {
  return db.select().from(foodEntries).where(eq(foodEntries.id, id)).get();
}

export function deleteEntries(ids: number[], date?: string): number {
  if (ids.length === 0) return 0;
  const where = date
    ? and(inArray(foodEntries.id, ids), eq(foodEntries.date, date))
    : inArray(foodEntries.id, ids);
  return db.delete(foodEntries).where(where).run().changes;
}

export function getGoals(): NutritionGoals {
  const row = db.select().from(nutritionGoals).where(eq(nutritionGoals.id, 1)).get();
  if (!row) return DEFAULT_GOALS;
  return { calories: row.calories, proteinG: row.proteinG, carbsG: row.carbsG, fatG: row.fatG };
}

export function setGoals(changes: Partial<NutritionGoals>): NutritionGoals {
  const next = { ...getGoals() };
  for (const key of ["calories", "proteinG", "carbsG", "fatG"] as const) {
    const value = changes[key];
    if (value !== undefined && Number.isFinite(value)) next[key] = round(value);
  }
  db.insert(nutritionGoals)
    .values({ id: 1, ...next })
    .onConflictDoUpdate({ target: nutritionGoals.id, set: next })
    .run();
  return next;
}

export function sumMacros(entries: Macros[]): Macros {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      proteinG: acc.proteinG + e.proteinG,
      carbsG: acc.carbsG + e.carbsG,
      fatG: acc.fatG + e.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );
}

export function getDayLog(date: string): DayLog {
  const entries = listEntriesForDate(date);
  return { date, entries, totals: sumMacros(entries), goals: getGoals() };
}
