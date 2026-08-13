"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { DEMO_MODE, db } from "@/lib/db";
import { getPriceQuote } from "@/lib/pricing";

export interface CheckoutActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Demo-mode "payment": records the purchase directly, without Razorpay.
 * Only available when DEMO_MODE is active; the price is always recomputed
 * server-side so the client can never dictate what it pays.
 */
export async function confirmDemoPurchaseAction(
  seriesId: string
): Promise<CheckoutActionResult> {
  if (!DEMO_MODE) {
    return { ok: false, error: "Simulated payments are only available in demo mode." };
  }

  const user = await requireUser("/pricing");
  if (user.role !== "learner" && user.role !== "admin") {
    return { ok: false, error: "Only learners can purchase a membership." };
  }

  try {
    const quote = await getPriceQuote(user.id, seriesId);
    if (quote.already_purchased) {
      return { ok: false, error: "Already purchased" };
    }

    const videos = await db.listVideos(seriesId);
    if (videos.length === 0) {
      return { ok: false, error: "This series is not open for membership yet." };
    }

    await db.createPurchase({
      learner_id: user.id,
      series_id: seriesId,
      amount_paid: quote.final_price,
    });

    revalidatePath("/");
    revalidatePath("/pricing");
    revalidatePath("/my-learning");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Purchase failed. Please try again.",
    };
  }
}
