import Link from "next/link";
import { CopyToClipboardButton } from "@/components/CopyToClipboardButton";
import { formatShoppingListAsText, getShoppingList } from "@/lib/repositories/shoppingList";

export default function ShoppingListPage() {
  const items = getShoppingList();
  const text = formatShoppingListAsText(items);

  return (
    <div className="flex flex-col gap-4 pb-20">
      <h1 className="text-xl font-semibold">Shopping list</h1>

      {items.length === 0 ? (
        <p className="opacity-70">
          No ingredients yet. Select recipes to cook from the{" "}
          <Link href="/cook" className="underline">
            cook list
          </Link>
          .
        </p>
      ) : (
        <>
          <p className="text-sm opacity-70">
            Copy this list and paste it into the Albert Heijn app&apos;s search to add items to your
            shopping list.
          </p>
          <CopyToClipboardButton text={text} />
          <ul className="flex flex-col gap-2 rounded-lg border p-4 text-sm">
            {items.map((item) => (
              <li key={item.normalizedName}>
                <span className="font-medium">{item.displayName}</span>{" "}
                <span className="opacity-70">
                  —{" "}
                  {item.contributions
                    .map((c) => (c.quantity ? `${c.quantity} (${c.recipeTitle})` : `(${c.recipeTitle})`))
                    .join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
