import type { IngredientInput } from "@/types/recipe";

export interface ParsedRecipe {
  title: string;
  ingredients: IngredientInput[];
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  totalTimeMinutes: number | null;
}

const INGREDIENTS_HEADER = /^(ingredients?|ingredi[eë]nten|you will need)\s*:?\s*$/i;
const METHOD_HEADER = /^(method|instructions?|directions?|bereiding(swijze)?|steps?)\s*:?\s*$/i;

const QUANTITY_UNIT_LINE =
  /^([\d/.½¼¾⅓⅔\s-]+)\s*(g|gram|kg|ml|l|liter|tbsp|tsp|el|tl|stuks?|cloves?|clove|cup|cups|oz|lb|pinch|bunch)?\.?\s+(.*)$/i;

const PREP_KEYWORDS = /(prep|voorbereiding)/i;
const COOK_KEYWORDS = /(cook|bak|oven|kook)/i;
const TIME_PATTERN = /(\d+)\s*(min(?:ut(?:en|es))?|uur|hour|hr)\b/gi;

function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function parseIngredientLine(line: string): IngredientInput {
  const match = line.match(QUANTITY_UNIT_LINE);
  if (match) {
    const [, quantityRaw, unit, name] = match;
    const quantity = `${quantityRaw.trim()}${unit ? ` ${unit}` : ""}`.trim();
    return { rawText: line, quantity: quantity || null, unit: unit ?? null, name: name.trim() };
  }
  return { rawText: line, quantity: null, unit: null, name: line.trim() };
}

function parseTimes(text: string): {
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  totalTimeMinutes: number | null;
} {
  let prepTimeMinutes: number | null = null;
  let cookTimeMinutes: number | null = null;
  let totalTimeMinutes: number | null = null;

  for (const line of splitLines(text)) {
    const matches = [...line.matchAll(TIME_PATTERN)];
    if (matches.length === 0) continue;

    for (const match of matches) {
      const value = Number(match[1]);
      const unit = match[2].toLowerCase();
      const minutes = unit.startsWith("uur") || unit.startsWith("hour") || unit.startsWith("hr")
        ? value * 60
        : value;

      if (PREP_KEYWORDS.test(line)) {
        prepTimeMinutes ??= minutes;
      } else if (COOK_KEYWORDS.test(line)) {
        cookTimeMinutes ??= minutes;
      } else {
        totalTimeMinutes ??= minutes;
      }
    }
  }

  if (totalTimeMinutes === null && prepTimeMinutes !== null && cookTimeMinutes !== null) {
    totalTimeMinutes = prepTimeMinutes + cookTimeMinutes;
  }

  return { prepTimeMinutes, cookTimeMinutes, totalTimeMinutes };
}

export function parseRecipe(rawText: string): ParsedRecipe {
  const lines = splitLines(rawText);
  const title = lines[0] ?? "";

  const ingredientsStart = lines.findIndex((line) => INGREDIENTS_HEADER.test(line));
  let ingredientLines: string[] = [];

  if (ingredientsStart !== -1) {
    const rest = lines.slice(ingredientsStart + 1);
    const methodStart = rest.findIndex((line) => METHOD_HEADER.test(line));
    ingredientLines = methodStart === -1 ? rest : rest.slice(0, methodStart);
  }

  const ingredients = ingredientLines.map(parseIngredientLine).filter((i) => i.name.length > 0);
  const times = parseTimes(rawText);

  return {
    title,
    ingredients,
    ...times,
  };
}
