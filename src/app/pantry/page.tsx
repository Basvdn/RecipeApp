import { PantryPicker } from "@/components/PantryPicker";
import { RecipeCard } from "@/components/RecipeCard";
import { listDistinctIngredients } from "@/lib/repositories/ingredients";
import { matchRecipesByPantry } from "@/lib/repositories/recipes";

export default async function PantryPage({
  searchParams,
}: {
  searchParams: Promise<{ have?: string }>;
}) {
  const { have } = await searchParams;
  const haveNames = have
    ? have
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : [];

  const allIngredients = listDistinctIngredients();
  const matches = haveNames.length > 0 ? matchRecipesByPantry(haveNames) : [];

  return (
    <div className="flex flex-col gap-4 pb-20">
      <h1 className="text-xl font-semibold">What can I cook?</h1>
      <p className="text-sm opacity-70">
        Pick the ingredients you currently have. Recipes are ranked by how few ingredients you&apos;re
        missing.
      </p>

      <PantryPicker allIngredients={allIngredients} initialSelected={haveNames} />

      {haveNames.length === 0 ? (
        <p className="opacity-70">Select at least one ingredient to see matching recipes.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map(({ recipe, missingIngredientNames }) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              footer={
                <p
                  className={`text-xs ${
                    missingIngredientNames.length === 0 ? "text-green-700" : "text-amber-700"
                  }`}
                >
                  {missingIngredientNames.length === 0
                    ? "You have everything!"
                    : `Missing ${missingIngredientNames.length}: ${missingIngredientNames.join(", ")}`}
                </p>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
