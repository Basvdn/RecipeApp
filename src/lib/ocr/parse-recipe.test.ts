import { describe, expect, it } from "vitest";
import { parseRecipe } from "./parse-recipe";

describe("parseRecipe", () => {
  it("extracts title, ingredients, and prep/cook times from a typical English layout", () => {
    const raw = `Coconut Macaroons
Prep time: 15 min
Cook time: 20 min

Ingredients
200g desiccated coconut
3 egg whites
150g sugar
1 tsp vanilla extract

Method
1. Preheat the oven to 180C.
2. Mix the coconut, sugar and vanilla.
3. Whisk the egg whites and fold in.
4. Bake for 20 minutes until golden.`;

    const result = parseRecipe(raw);

    expect(result.title).toBe("Coconut Macaroons");
    expect(result.prepTimeMinutes).toBe(15);
    expect(result.cookTimeMinutes).toBe(20);
    expect(result.ingredients).toHaveLength(4);
    expect(result.ingredients[0]).toMatchObject({ quantity: "200 g", name: "desiccated coconut" });
    expect(result.ingredients[1]).toMatchObject({ name: "egg whites" });
  });

  it("handles Dutch section headers", () => {
    const raw = `Kip Traybake
Ingrediënten
4 kippendijen
2 uien
500 g aardappelen

Bereiding
Oven op 200 graden.`;

    const result = parseRecipe(raw);

    expect(result.title).toBe("Kip Traybake");
    expect(result.ingredients).toHaveLength(3);
    expect(result.ingredients[2]).toMatchObject({ name: "aardappelen" });
  });

  it("falls back to whole-line ingredient names when no quantity is detected", () => {
    const raw = `Simple Salad
Ingredients
a big handful of rocket
Method
Toss together.`;

    const result = parseRecipe(raw);

    expect(result.ingredients).toEqual([
      { rawText: "a big handful of rocket", quantity: null, unit: null, name: "a big handful of rocket" },
    ]);
  });

  it("derives total time from prep + cook when no explicit total is present", () => {
    const raw = `Slow Cooked Stew
Prep 10 min
Cook 2 uur
Ingredients
1 kg beef
Method
Cook low and slow.`;

    const result = parseRecipe(raw);

    expect(result.prepTimeMinutes).toBe(10);
    expect(result.cookTimeMinutes).toBe(120);
    expect(result.totalTimeMinutes).toBe(130);
  });

  it("returns no ingredients when there is no recognizable ingredients section", () => {
    const raw = `Just a title
Some unrelated OCR noise.`;

    const result = parseRecipe(raw);

    expect(result.ingredients).toEqual([]);
  });
});
