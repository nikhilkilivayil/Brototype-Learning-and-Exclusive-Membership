"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

/** Uniform result shape returned by every admin action — never throws. */
export interface ActionResult {
  ok: boolean;
  error?: string;
}

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

function toErrorMessage(err: unknown): string {
  return err instanceof Error && err.message
    ? err.message
    : "Something went wrong. Please try again.";
}

/** Revalidates the public catalog + admin dashboard (and a series page). */
function revalidateAfterWrite(seriesId?: string) {
  revalidatePath("/");
  revalidatePath("/admin");
  if (seriesId) revalidatePath(`/admin/series/${seriesId}`);
}

interface SeriesInput {
  title: string;
  description: string;
  thumbnail_url: string;
  base_price: number;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateSeriesInput(input: SeriesInput): string | null {
  if (!input.title || input.title.trim().length === 0) {
    return "Title is required.";
  }
  if (!input.thumbnail_url || !isHttpUrl(input.thumbnail_url.trim())) {
    return "Thumbnail URL must be a valid link starting with http:// or https://.";
  }
  if (
    typeof input.base_price !== "number" ||
    !Number.isFinite(input.base_price) ||
    input.base_price < 0
  ) {
    return "Base price must be 0 or more.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Series CRUD
// ---------------------------------------------------------------------------

export async function createSeriesAction(
  input: SeriesInput
): Promise<ActionResult> {
  await requireRole(["admin"]);
  const invalid = validateSeriesInput(input);
  if (invalid) return { ok: false, error: invalid };
  try {
    await db.createSeries({
      title: input.title.trim(),
      description: input.description.trim(),
      thumbnail_url: input.thumbnail_url.trim(),
      base_price: Math.round(input.base_price),
    });
    revalidateAfterWrite();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toErrorMessage(err) };
  }
}

export async function updateSeriesAction(
  id: string,
  input: SeriesInput
): Promise<ActionResult> {
  await requireRole(["admin"]);
  const invalid = validateSeriesInput(input);
  if (invalid) return { ok: false, error: invalid };
  try {
    const existing = await db.getSeries(id);
    if (!existing) return { ok: false, error: "Series not found." };
    await db.updateSeries(id, {
      title: input.title.trim(),
      description: input.description.trim(),
      thumbnail_url: input.thumbnail_url.trim(),
      base_price: Math.round(input.base_price),
    });
    revalidateAfterWrite(id);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toErrorMessage(err) };
  }
}

export async function deleteSeriesAction(id: string): Promise<ActionResult> {
  await requireRole(["admin"]);
  try {
    const existing = await db.getSeries(id);
    if (!existing) return { ok: false, error: "Series not found." };
    await db.deleteSeries(id);
    revalidateAfterWrite(id);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toErrorMessage(err) };
  }
}

// ---------------------------------------------------------------------------
// Video CRUD + ordering
// ---------------------------------------------------------------------------

export async function createVideoAction(input: {
  series_id: string;
  title: string;
  youtube_id: string;
}): Promise<ActionResult> {
  await requireRole(["admin"]);
  if (!input.title || input.title.trim().length === 0) {
    return { ok: false, error: "Video title is required." };
  }
  if (!YOUTUBE_ID_RE.test(input.youtube_id)) {
    return { ok: false, error: "That doesn't look like a valid YouTube video ID." };
  }
  try {
    const series = await db.getSeries(input.series_id);
    if (!series) return { ok: false, error: "Series not found." };
    const videos = await db.listVideos(input.series_id);
    const nextIndex =
      videos.length === 0
        ? 1
        : Math.max(...videos.map((v) => v.order_index)) + 1;
    await db.createVideo({
      series_id: input.series_id,
      title: input.title.trim(),
      youtube_id: input.youtube_id,
      order_index: nextIndex,
    });
    revalidateAfterWrite(input.series_id);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toErrorMessage(err) };
  }
}

export async function updateVideoAction(
  id: string,
  input: { title: string; youtube_id: string }
): Promise<ActionResult> {
  await requireRole(["admin"]);
  if (!input.title || input.title.trim().length === 0) {
    return { ok: false, error: "Video title is required." };
  }
  if (!YOUTUBE_ID_RE.test(input.youtube_id)) {
    return { ok: false, error: "That doesn't look like a valid YouTube video ID." };
  }
  try {
    const existing = await db.getVideo(id);
    if (!existing) return { ok: false, error: "Video not found." };
    await db.updateVideo(id, {
      title: input.title.trim(),
      youtube_id: input.youtube_id,
    });
    revalidateAfterWrite(existing.series_id);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toErrorMessage(err) };
  }
}

export async function deleteVideoAction(id: string): Promise<ActionResult> {
  await requireRole(["admin"]);
  try {
    const existing = await db.getVideo(id);
    if (!existing) return { ok: false, error: "Video not found." };
    await db.deleteVideo(id);
    revalidateAfterWrite(existing.series_id);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toErrorMessage(err) };
  }
}

/** Swaps the order_index of two videos in the same series (move up/down). */
export async function swapVideoOrderAction(
  seriesId: string,
  videoIdA: string,
  videoIdB: string
): Promise<ActionResult> {
  await requireRole(["admin"]);
  try {
    const [a, b] = await Promise.all([
      db.getVideo(videoIdA),
      db.getVideo(videoIdB),
    ]);
    if (!a || !b) return { ok: false, error: "Video not found." };
    if (a.series_id !== seriesId || b.series_id !== seriesId) {
      return { ok: false, error: "Videos do not belong to this series." };
    }
    // Renumber every video 1..n first (writing only where the index differs).
    // This self-heals duplicate order_index values from legacy/racing writes,
    // which would otherwise make the swap below a permanent no-op.
    const videos = await db.listVideos(seriesId);
    let position = 0;
    for (const video of videos) {
      position += 1;
      if (video.order_index !== position) {
        await db.updateVideo(video.id, { order_index: position });
      }
    }
    const positionA = videos.findIndex((v) => v.id === a.id) + 1;
    const positionB = videos.findIndex((v) => v.id === b.id) + 1;
    if (positionA === 0 || positionB === 0) {
      return { ok: false, error: "Video not found." };
    }
    await db.updateVideo(a.id, { order_index: positionB });
    await db.updateVideo(b.id, { order_index: positionA });
    revalidateAfterWrite(seriesId);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toErrorMessage(err) };
  }
}

// ---------------------------------------------------------------------------
// Pricing settings
// ---------------------------------------------------------------------------

export async function updateSettingsAction(
  addonDiscountPercentage: number
): Promise<ActionResult> {
  await requireRole(["admin"]);
  if (
    typeof addonDiscountPercentage !== "number" ||
    !Number.isFinite(addonDiscountPercentage) ||
    addonDiscountPercentage < 0 ||
    addonDiscountPercentage > 100
  ) {
    return { ok: false, error: "Discount must be between 0 and 100." };
  }
  try {
    await db.updateSettings({
      addon_discount_percentage: Math.round(addonDiscountPercentage),
    });
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/settings");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toErrorMessage(err) };
  }
}
