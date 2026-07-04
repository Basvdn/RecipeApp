import { listDistinctIngredients } from "@/lib/repositories/ingredients";

export async function GET() {
  return Response.json({ ingredients: listDistinctIngredients() });
}
