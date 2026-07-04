import Link from "next/link";
import type { Recipe } from "@/types/recipe";

export function RecipeCard({ recipe, footer }: { recipe: Recipe; footer?: React.ReactNode }) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="flex flex-col gap-1 rounded-lg border p-4 hover:bg-black/5"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">{recipe.title}</h3>
        {recipe.selectedToCook && (
          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
            To cook
          </span>
        )}
      </div>
      {recipe.sourceText && <p className="text-sm opacity-70">{recipe.sourceText}</p>}
      <div className="flex flex-wrap gap-1 text-xs opacity-70">
        <span>{recipe.ingredients.length} ingredients</span>
        {recipe.totalTimeMinutes != null && <span>· {recipe.totalTimeMinutes} min total</span>}
        {recipe.hasSpecialIngredients && <span>· specialty shop needed</span>}
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
      {footer}
    </Link>
  );
}
