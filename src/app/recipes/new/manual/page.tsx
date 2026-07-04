import { RecipeForm } from "@/components/RecipeForm";
import { listTags } from "@/lib/repositories/tags";

export default function NewRecipeManualPage() {
  const tags = listTags();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Add recipe</h1>
      <RecipeForm allTags={tags} />
    </div>
  );
}
