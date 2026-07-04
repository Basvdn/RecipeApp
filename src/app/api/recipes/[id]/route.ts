import { NextRequest } from "next/server";
import { deleteRecipe, getRecipe, updateRecipe } from "@/lib/repositories/recipes";
import type { RecipeInput } from "@/types/recipe";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recipe = getRecipe(Number(id));
  if (!recipe) {
    return Response.json({ error: "Recipe not found" }, { status: 404 });
  }
  return Response.json({ recipe });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as RecipeInput;

  if (!getRecipe(Number(id))) {
    return Response.json({ error: "Recipe not found" }, { status: 404 });
  }

  const recipe = updateRecipe(Number(id), body);
  return Response.json({ recipe });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteRecipe(Number(id));
  return new Response(null, { status: 204 });
}
