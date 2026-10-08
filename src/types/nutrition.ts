export const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;
export type Meal = (typeof MEALS)[number];

export interface Macros {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface FoodEntry extends Macros {
  id: number;
  date: string;
  meal: Meal;
  name: string;
  quantity: string | null;
  createdAt: string;
}

export interface FoodEntryInput extends Macros {
  date: string;
  meal: Meal;
  name: string;
  quantity?: string | null;
}

export type NutritionGoals = Macros;

export interface DayLog {
  date: string;
  entries: FoodEntry[];
  totals: Macros;
  goals: NutritionGoals;
}

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}
