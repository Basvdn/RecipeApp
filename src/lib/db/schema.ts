import { sqliteTable, text, integer, primaryKey, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const recipes = sqliteTable("recipes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  sourceText: text("source_text"),
  prepTimeMinutes: integer("prep_time_minutes"),
  cookTimeMinutes: integer("cook_time_minutes"),
  totalTimeMinutes: integer("total_time_minutes"),
  ocrRawText: text("ocr_raw_text"),
  hasSpecialIngredients: integer("has_special_ingredients", { mode: "boolean" })
    .notNull()
    .default(false),
  selectedToCook: integer("selected_to_cook", { mode: "boolean" })
    .notNull()
    .default(false),
  selectedAt: text("selected_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const ingredients = sqliteTable("ingredients", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipeId: integer("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  rawText: text("raw_text").notNull(),
  quantity: text("quantity"),
  unit: text("unit"),
  name: text("name").notNull(),
  normalizedName: text("normalized_name").notNull(),
});

export const photos = sqliteTable("photos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipeId: integer("recipe_id")
    .notNull()
    .references(() => recipes.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(),
  position: integer("position").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const tags = sqliteTable(
  "tags",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    category: text("category", { enum: ["meal_type", "food_category"] }).notNull(),
    name: text("name").notNull(),
  },
  (table) => [uniqueIndex("tags_category_name_idx").on(table.category, table.name)]
);

export const recipeTags = sqliteTable(
  "recipe_tags",
  {
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.recipeId, table.tagId] })]
);
