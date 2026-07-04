"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SelectToCookButton({ recipeId, selected }: { recipeId: number; selected: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      await fetch(`/api/recipes/${recipeId}/select`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected: !selected }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`rounded px-4 py-2 text-sm font-medium disabled:opacity-50 ${
        selected ? "border" : "bg-foreground text-background"
      }`}
    >
      {selected ? "Remove from cook list" : "Add to cook list"}
    </button>
  );
}
