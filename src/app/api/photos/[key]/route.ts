import { localFsStorage } from "@/lib/storage/local-fs-storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  try {
    const buffer = await localFsStorage.read(key);
    const contentType = key.endsWith(".png") ? "image/png" : "image/jpeg";
    return new Response(new Uint8Array(buffer), {
      headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=31536000, immutable" },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
