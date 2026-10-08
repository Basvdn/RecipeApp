import { NextRequest } from "next/server";
import { getGoals, setGoals } from "@/lib/repositories/foodLog";
import type { NutritionGoals } from "@/types/nutrition";

export async function GET() {
  return Response.json({ goals: getGoals() });
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as Partial<NutritionGoals>;
  const changes: Partial<NutritionGoals> = {};
  for (const key of ["calories", "proteinG", "carbsG", "fatG"] as const) {
    const value = body[key];
    if (value === undefined) continue;
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      return Response.json({ error: `${key} must be a non-negative number` }, { status: 400 });
    }
    changes[key] = value;
  }
  return Response.json({ goals: setGoals(changes) });
}
