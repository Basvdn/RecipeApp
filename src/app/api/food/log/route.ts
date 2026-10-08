import { NextRequest } from "next/server";
import { getDayLog } from "@/lib/repositories/foodLog";
import { isIsoDate } from "@/lib/nutrition/dates";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!isIsoDate(date)) {
    return Response.json({ error: "date (YYYY-MM-DD) is required" }, { status: 400 });
  }
  return Response.json(getDayLog(date));
}
