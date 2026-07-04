import { db } from "./client";
import { tags } from "./schema";

const defaultTags: { category: "meal_type" | "food_category"; name: string }[] = [
  { category: "meal_type", name: "Traybake / oven dish" },
  { category: "meal_type", name: "Salad" },
  { category: "meal_type", name: "Slowcook" },
  { category: "meal_type", name: "One-pan" },
  { category: "meal_type", name: "Multiple pans" },
  { category: "food_category", name: "Pasta" },
  { category: "food_category", name: "Rice" },
  { category: "food_category", name: "Potato" },
  { category: "food_category", name: "Fish" },
  { category: "food_category", name: "Vegetarian" },
  { category: "food_category", name: "Meat" },
  { category: "food_category", name: "Poultry" },
];

for (const tag of defaultTags) {
  db.insert(tags).values(tag).onConflictDoNothing().run();
}

console.log(`Seeded ${defaultTags.length} default tags (skipping any that already exist).`);
