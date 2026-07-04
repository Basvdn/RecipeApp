import { NextRequest } from "next/server";
import { getRecipe, setSelectedToCook } from "@/lib/repositories/recipes";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as { selected: boolean };

  if (!getRecipe(Number(id))) {
    return Response.json({ error: "Recipe not found" }, { status: 404 });
  }

  const recipe = setSelectedToCook(Number(id), body.selected);
  return Response.json({ recipe });
}
