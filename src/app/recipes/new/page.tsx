import Link from "next/link";

export default function NewRecipeChoicePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Add recipe</h1>
      <Link
        href="/recipes/new/photo"
        className="rounded bg-foreground px-4 py-4 text-center font-medium text-background"
      >
        Scan from a cookbook photo
      </Link>
      <Link href="/recipes/new/manual" className="rounded border px-4 py-4 text-center font-medium">
        Enter manually
      </Link>
    </div>
  );
}
