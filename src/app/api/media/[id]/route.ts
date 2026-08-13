import { getMockMedia } from "@/lib/db/mock";

/**
 * Serves demo-mode uploads (images / audio recordings) from the in-memory
 * store. In production mode media lives in Supabase Storage and is served
 * from public URLs, so this route is never used.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const media = getMockMedia(id);
  if (!media) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(new Uint8Array(media.data), {
    headers: {
      "Content-Type": media.mime,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
