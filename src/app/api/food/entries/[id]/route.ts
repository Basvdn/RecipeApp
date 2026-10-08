import { NextRequest } from "next/server";
import { deleteEntries } from "@/lib/repositories/foodLog";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteEntries([Number(id)]);
  return new Response(null, { status: 204 });
}
