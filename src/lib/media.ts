import { db } from "@/lib/db";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_AUDIO_BYTES = 15 * 1024 * 1024; // 15 MB

/**
 * Raster formats only. SVG is deliberately excluded: it can carry scripts,
 * and attachments are served same-origin — an SVG upload would be stored XSS
 * against the support executives who open it.
 */
const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
]);

/**
 * Persists an uploaded image from a FormData file field.
 * Returns null when no file was provided.
 */
export async function saveUploadedImage(
  file: File | null | undefined
): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Only PNG, JPEG, WebP, GIF or AVIF images can be attached.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large (max 8 MB).");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  return db.saveMedia(bytes, file.type || "image/png", "image");
}

/**
 * Persists a recorded audio blob from a FormData file field.
 * Returns null when no recording was provided.
 */
export async function saveUploadedAudio(
  file: File | null | undefined
): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  if (!file.type.startsWith("audio/") && !file.type.startsWith("video/webm")) {
    throw new Error("Only audio recordings can be attached.");
  }
  if (file.size > MAX_AUDIO_BYTES) {
    throw new Error("Audio recording is too large (max 15 MB).");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  return db.saveMedia(bytes, file.type || "audio/webm", "audio");
}
