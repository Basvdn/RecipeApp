import { notFound } from "next/navigation";
import { RecipeForm } from "@/components/RecipeForm";
import { getRecipe } from "@/lib/repositories/recipes";
import { listTags } from "@/lib/repositories/tags";
import type { RecipeInput } from "@/types/recipe";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = getRecipe(Number(id));
  if (!recipe) notFound();

  const tags = listTags();

  const initialValues: Partial<RecipeInput> = {
    title: recipe.title,
    sourceText: recipe.sourceText,
    prepTimeMinutes: recipe.prepTimeMinutes,
    cookTimeMinutes: recipe.cookTimeMinutes,
    totalTimeMinutes: recipe.totalTimeMinutes,
    ocrRawText: recipe.ocrRawText,
    hasSpecialIngredients: recipe.hasSpecialIngredients,
    ingredients: recipe.ingredients.map((ing) => ({
      rawText: ing.rawText,
      quantity: ing.quantity,
      unit: ing.unit,
      name: ing.name,
    })),
    tagIds: recipe.tags.map((tag) => tag.id),
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Edit recipe</h1>
      <RecipeForm allTags={tags} recipeId={recipe.id} initialValues={initialValues} />
    </div>
  );
}
