import Link from "next/link";
import { notFound } from "next/navigation";
import { SelectToCookButton } from "@/components/SelectToCookButton";
import { getRecipe } from "@/lib/repositories/recipes";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = getRecipe(Number(id));
  if (!recipe) notFound();

  return (
    <div className="flex flex-col gap-4 pb-20">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-xl font-semibold">{recipe.title}</h1>
        <Link href={`/recipes/${recipe.id}/edit`} className="text-sm underline">
          Edit
        </Link>
      </div>

      {recipe.sourceText && <p className="text-sm opacity-70">{recipe.sourceText}</p>}

      {recipe.photos.length > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/photos/${recipe.photos[0].storageKey}`}
          alt={recipe.title}
          className="rounded-lg border"
        />
      )}

      <div className="flex gap-4 text-sm opacity-80">
        {recipe.prepTimeMinutes != null && <span>Prep: {recipe.prepTimeMinutes} min</span>}
        {recipe.cookTimeMinutes != null && <span>Cook: {recipe.cookTimeMinutes} min</span>}
        {recipe.totalTimeMinutes != null && <span>Total: {recipe.totalTimeMinutes} min</span>}
      </div>

      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {recipe.tags.map((tag) => (
            <span key={tag.id} className="rounded-full border px-2 py-0.5 text-xs">
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {recipe.hasSpecialIngredients && (
        <p className="text-sm text-amber-700">Needs ingredients from a specialty shop</p>
      )}

      <div>
        <h2 className="mb-2 font-medium">Ingredients</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {recipe.ingredients.map((ingredient) => (
            <li key={ingredient.id}>
              {ingredient.quantity ? `${ingredient.quantity} ` : ""}
              {ingredient.name}
            </li>
          ))}
        </ul>
      </div>

      <SelectToCookButton recipeId={recipe.id} selected={recipe.selectedToCook} />
    </div>
  );
}
