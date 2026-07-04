import type { NextRequest } from "next/server";
import { localFsStorage } from "@/lib/storage/local-fs-storage";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const extension = file.type === "image/png" ? "png" : "jpg";
  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = await localFsStorage.put(buffer, extension);

  return Response.json({ storageKey }, { status: 201 });
}
