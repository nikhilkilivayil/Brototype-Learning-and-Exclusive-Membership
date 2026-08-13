import crypto from "crypto";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/razorpay/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, seriesId }
 *
 * Verifies the Razorpay checkout signature (HMAC-SHA256 of
 * "order_id|payment_id" with the key secret), then fetches the order from
 * Razorpay and requires that its notes bind it to exactly this series and
 * this user and that it is actually paid — the signature alone proves only
 * that *some* order was paid, not which membership it was for. Records the
 * purchase at the amount Razorpay actually charged. Idempotent: an
 * already-owned series returns ok.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in to verify a payment." },
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
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      seriesId?: string;
    } | null;

    const razorpayOrderId = body?.razorpay_order_id;
    const razorpayPaymentId = body?.razorpay_payment_id;
    const razorpaySignature = body?.razorpay_signature;
    const seriesId = body?.seriesId;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !seriesId) {
      return NextResponse.json(
        { ok: false, error: "Missing payment verification fields." },
        { status: 400 }
      );
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expected, "utf8");
    const receivedBuffer = Buffer.from(razorpaySignature, "utf8");
    const signatureValid =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!signatureValid) {
      return NextResponse.json(
        { ok: false, error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Bind the payment to this series + user via the order's notes (set at
    // order creation) so a valid signature for a cheap order can't be
    // replayed to unlock a different (or pricier) series.
    const instance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
    const order = await instance.orders.fetch(razorpayOrderId);
    const notes = (order.notes ?? {}) as Record<string, string | number>;

    if (
      String(notes.series_id ?? "") !== seriesId ||
      String(notes.learner_id ?? "") !== user.id
    ) {
      return NextResponse.json(
        { ok: false, error: "Payment does not match this purchase." },
        { status: 400 }
      );
    }
    if (order.status !== "paid") {
      return NextResponse.json(
        { ok: false, error: "Payment has not been captured yet." },
        { status: 400 }
      );
    }

    const alreadyOwned = await db.hasPurchased(user.id, seriesId);
    if (alreadyOwned) {
      // Idempotent — e.g. a retried verify call after a slow network.
      return NextResponse.json({ ok: true });
    }

    // Record what Razorpay actually collected (order.amount is in paise) so
    // revenue reporting always matches settled money, even if the discount
    // settings changed between order creation and verification.
    await db.createPurchase({
      learner_id: user.id,
      series_id: seriesId,
      amount_paid: Math.round(Number(order.amount) / 100),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Payment verification failed.",
      },
      { status: 500 }
    );
  }
}
