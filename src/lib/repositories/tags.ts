import { db } from "@/lib/db/client";
import { tags } from "@/lib/db/schema";
import type { Tag, TagCategory } from "@/types/recipe";

export function listTags(): Tag[] {
  return db.select().from(tags).all();
}

export function createTag(category: TagCategory, name: string): Tag {
  return db.insert(tags).values({ category, name: name.trim() }).returning().get();
}
