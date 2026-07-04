"use client";

import { useState } from "react";
import type { Tag, TagCategory } from "@/types/recipe";

interface Props {
  label: string;
  category: TagCategory;
  allTags: Tag[];
  selectedTagIds: number[];
  onChange: (tagIds: number[]) => void;
  onTagCreated: (tag: Tag) => void;
}

export function TagPicker({ label, category, allTags, selectedTagIds, onChange, onTagCreated }: Props) {
  const [newTagName, setNewTagName] = useState("");
  const [creating, setCreating] = useState(false);

  const categoryTags = allTags.filter((t) => t.category === category);

  function toggle(tagId: number) {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  }

  async function addTag() {
    const name = newTagName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, name }),
      });
      if (res.ok) {
        const { tag } = await res.json();
        onTagCreated(tag);
        onChange([...selectedTagIds, tag.id]);
        setNewTagName("");
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-2">
        {categoryTags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggle(tag.id)}
            className={`rounded-full border px-3 py-1 text-sm ${
              selectedTagIds.includes(tag.id) ? "bg-foreground text-background" : ""
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder={`Add new ${label.toLowerCase()}`}
          className="flex-1 rounded border px-2 py-1 text-sm"
        />
        <button
          type="button"
          onClick={addTag}
          disabled={creating || !newTagName.trim()}
          className="rounded border px-3 py-1 text-sm disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
