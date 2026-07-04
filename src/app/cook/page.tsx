import Link from "next/link";
import { RecipeCard } from "@/components/RecipeCard";
import { listRecipes } from "@/lib/repositories/recipes";

export default function CookPage() {
  const selected = listRecipes().filter((r) => r.selectedToCook);

  return (
    <div className="flex flex-col gap-4 pb-20">
      <h1 className="text-xl font-semibold">Cook</h1>

      {selected.length === 0 ? (
        <p className="opacity-70">
          Nothing selected yet. Open a recipe in the{" "}
          <Link href="/library" className="underline">
            library
          </Link>{" "}
          and tap &ldquo;Add to cook list&rdquo;.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {selected.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
          <Link
            href="/shopping-list"
            className="rounded bg-foreground px-4 py-3 text-center font-medium text-background"
          >
            Build shopping list ({selected.length} recipe{selected.length === 1 ? "" : "s"})
          </Link>
        </>
      )}
    </div>
  );
}
