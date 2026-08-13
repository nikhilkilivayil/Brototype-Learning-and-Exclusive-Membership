import { db } from "@/lib/db";
import type { PriceQuote } from "@/lib/types";

/**
 * Dynamic pricing:
 *  - First-ever series purchase → base price.
 *  - Any later purchase → `addon_discount_percentage` (System Settings) off.
 */
export async function getPriceQuote(
  learnerId: string | null,
  seriesId: string
): Promise<PriceQuote> {
  const series = await db.getSeries(seriesId);
  if (!series) throw new Error("Series not found");
  const settings = await db.getSettings();

  let alreadyPurchased = false;
  let discountApplied = false;
  if (learnerId) {
    const [owned, priorPurchases] = await Promise.all([
      db.hasPurchased(learnerId, seriesId),
      db.listPurchasesByLearner(learnerId),
    ]);
    alreadyPurchased = owned;
    discountApplied =
      !owned &&
      priorPurchases.length > 0 &&
      settings.addon_discount_percentage > 0;
  }

  const pct = discountApplied ? settings.addon_discount_percentage : 0;
  const finalPrice = Math.round((series.base_price * (100 - pct)) / 100);

  return {
    series_id: series.id,
    base_price: series.base_price,
    discount_percentage: pct,
    final_price: finalPrice,
    discount_applied: discountApplied,
    already_purchased: alreadyPurchased,
  };
}

// Re-exported for server-side callers; client components must import it from
// "@/lib/format" instead (this module chains to next/headers via @/lib/db).
export { formatINR } from "./format";
