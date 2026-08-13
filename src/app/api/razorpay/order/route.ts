import crypto from "crypto";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getCurrentUser } from "@/lib/auth";
import { DEMO_MODE, db } from "@/lib/db";
import { getPriceQuote } from "@/lib/pricing";

/**
 * POST /api/razorpay/order
 * Body: { seriesId: string }
 *
 * Creates a Razorpay order for the current user's price quote (recomputed
 * server-side). The order carries `notes.series_id` / `notes.learner_id`,
 * which the verify route reads back to bind the payment to exactly this
 * series + user. In demo mode no order is created — the client is told to
 * run the simulated-payment flow instead.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to purchase a membership." },
        { status: 401 }
      );
    }
    if (user.role !== "learner" && user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Only learners can purchase a membership." },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      seriesId?: string;
    } | null;
    const seriesId = body?.seriesId;
    if (!seriesId || typeof seriesId !== "string") {
      return NextResponse.json(
        { ok: false, error: "seriesId is required." },
        { status: 400 }
      );
    }

    const series = await db.getSeries(seriesId);
    if (!series) {
      return NextResponse.json(
        { ok: false, error: "Series not found." },
        { status: 404 }
      );
    }

    const videos = await db.listVideos(seriesId);
    if (videos.length === 0) {
      return NextResponse.json(
        { ok: false, error: "This series is not open for membership yet." },
        { status: 400 }
      );
    }

    const quote = await getPriceQuote(user.id, seriesId);
    if (quote.already_purchased) {
      return NextResponse.json(
        { ok: false, error: "You already own this series." },
        { status: 400 }
      );
    }

    if (DEMO_MODE) {
      return NextResponse.json({ demo: true });
    }

    const instance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await instance.orders.create({
      amount: quote.final_price * 100, // paise
      currency: "INR",
      // Razorpay caps receipts at 40 chars — UUID pairs don't fit, so the
      // real series/user binding lives in notes (read back at verify time).
      receipt: `rcpt_${crypto.randomBytes(8).toString("hex")}`,
      notes: {
        series_id: seriesId,
        learner_id: user.id,
      },
    });

    return NextResponse.json({
      demo: false,
      orderId: order.id,
      amount: quote.final_price * 100,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      name: "Brototype Learn",
      description: `Exclusive Membership — ${series.title}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Could not create the payment order.",
      },
      { status: 500 }
    );
  }
}
