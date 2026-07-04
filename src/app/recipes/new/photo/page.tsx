"use client";

import { useEffect, useState } from "react";
import { PhotoCapture } from "@/components/PhotoCapture";
import { RecipeForm } from "@/components/RecipeForm";
import { parseRecipe, type ParsedRecipe } from "@/lib/ocr/parse-recipe";
import { runOcr } from "@/lib/ocr/run-ocr";
import { downscaleImage } from "@/lib/utils/image-resize";
import type { RecipeInput, Tag } from "@/types/recipe";

type Stage = "idle" | "uploading" | "recognizing" | "review" | "error";

export default function NewRecipePhotoPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [parsed, setParsed] = useState<ParsedRecipe | null>(null);
  const [ocrRawText, setOcrRawText] = useState("");
  const [photoStorageKey, setPhotoStorageKey] = useState<string | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then((data) => setAllTags(data.tags));
  }, []);

  async function handlePhotoSelected(file: File) {
    setError(null);
    setStage("uploading");
    setProgress(0);

    try {
      const resized = await downscaleImage(file);
      setPhotoPreviewUrl(URL.createObjectURL(resized));

      const formData = new FormData();
      formData.append("file", resized, "recipe.jpg");
      const uploadRes = await fetch("/api/photos", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Failed to save photo");
      const { storageKey } = await uploadRes.json();
      setPhotoStorageKey(storageKey);

      setStage("recognizing");
      const text = await runOcr(resized, setProgress);
      setOcrRawText(text);
      setParsed(parseRecipe(text));
      setStage("review");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong scanning that photo");
      setStage("error");
    }
  }

  if (stage === "review" && parsed) {
    const initialValues: Partial<RecipeInput> = {
      title: parsed.title,
      prepTimeMinutes: parsed.prepTimeMinutes,
      cookTimeMinutes: parsed.cookTimeMinutes,
      totalTimeMinutes: parsed.totalTimeMinutes,
      ocrRawText,
      hasSpecialIngredients: false,
      ingredients: parsed.ingredients.length > 0 ? parsed.ingredients : [{ rawText: "", quantity: "", name: "" }],
      tagIds: [],
    };

    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold">Check what we scanned</h1>
        <p className="text-sm opacity-70">
          Compare the photo with the fields below and correct anything OCR got wrong before saving.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
          <div className="flex flex-col gap-3 sm:sticky sm:top-4">
            {photoPreviewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreviewUrl} alt="Scanned recipe page" className="rounded-lg border" />
            )}
            <details className="rounded border p-3 text-xs opacity-70">
              <summary className="cursor-pointer">Raw scanned text</summary>
              <pre className="mt-2 whitespace-pre-wrap">{ocrRawText}</pre>
            </details>
          </div>
          <RecipeForm
            allTags={allTags}
            initialValues={initialValues}
            photoStorageKeys={photoStorageKey ? [photoStorageKey] : undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Scan a recipe</h1>

      {stage === "idle" && (
        <>
          <p className="text-sm opacity-70">
            Photograph a page from a cookbook, or choose an existing photo.
          </p>
          <PhotoCapture onSelect={handlePhotoSelected} />
        </>
      )}

      {(stage === "uploading" || stage === "recognizing") && (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-sm opacity-70">
            {stage === "uploading" ? "Saving photo…" : `Reading text… ${Math.round(progress * 100)}%`}
          </p>
          <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full bg-foreground transition-all"
              style={{ width: `${stage === "uploading" ? 10 : Math.max(10, progress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {stage === "error" && (
        <div className="flex flex-col gap-3">
          <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-800">{error}</p>
          <PhotoCapture onSelect={handlePhotoSelected} />
        </div>
      )}
    </div>
  );
}
