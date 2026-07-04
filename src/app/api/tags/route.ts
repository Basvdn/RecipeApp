import { NextRequest } from "next/server";
import { createTag, listTags } from "@/lib/repositories/tags";
import type { TagCategory } from "@/types/recipe";

export async function GET() {
  return Response.json({ tags: listTags() });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { category: TagCategory; name: string };

  if (!body.name?.trim() || !["meal_type", "food_category"].includes(body.category)) {
    return Response.json({ error: "Invalid category or name" }, { status: 400 });
  }

  const tag = createTag(body.category, body.name);
  return Response.json({ tag }, { status: 201 });
}
