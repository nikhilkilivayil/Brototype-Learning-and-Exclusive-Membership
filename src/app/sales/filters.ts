import { normalizePhone } from "@/lib/format";
import type { Purchase, TutorialSeries, User } from "@/lib/types";

/**
 * Shared filter model for the sales dashboard (/sales) and its CSV export
 * (/sales/export). Plain module — safe to import from server pages, route
 * handlers and client components alike.
 */

export interface SalesFilters {
  /** Case-insensitive search across learner name and phone number. */
  q?: string;
  /** Registration date range, inclusive (YYYY-MM-DD). */
  regFrom?: string;
  regTo?: string;
  /** paying = at least one purchase; free = none. */
  status?: "all" | "paying" | "free";
  /** Purchased this specific series. */
  seriesId?: string;
  /** Has at least one purchase inside this date range, inclusive. */
  purFrom?: string;
  purTo?: string;
  /** asked = has asked at least one doubt; never = none. */
  activity?: "all" | "asked" | "never";
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function choice<T extends string>(
  value: string | undefined,
  allowed: readonly T[]
): T | undefined {
  const trimmed = clean(value);
  return trimmed && (allowed as readonly string[]).includes(trimmed)
    ? (trimmed as T)
    : undefined;
}

/**
 * Parses the raw query params (page searchParams or export URL params) into
 * a SalesFilters. Empty values and "all" selections normalize to undefined.
 */
export function parseSalesFilters(
  searchParams: Record<string, string | undefined>
): SalesFilters {
  const status = choice(searchParams.status, ["all", "paying", "free"] as const);
  const activity = choice(searchParams.activity, [
    "all",
    "asked",
    "never",
  ] as const);
  const seriesId = clean(searchParams.series);
  return {
    q: clean(searchParams.q),
    regFrom: clean(searchParams.reg_from),
    regTo: clean(searchParams.reg_to),
    status: status === "all" ? undefined : status,
    seriesId: seriesId === "all" ? undefined : seriesId,
    purFrom: clean(searchParams.pur_from),
    purTo: clean(searchParams.pur_to),
    activity: activity === "all" ? undefined : activity,
  };
}

/** One learner row on the sales dashboard / in the CSV export. */
export interface LearnerRow {
  user: User;
  /** This learner's purchases, oldest first. */
  purchases: Purchase[];
  /** Titles of the purchased series (deduped, purchase order). */
  seriesTitles: string[];
  totalSpent: number;
  questionCount: number;
  lastPurchaseAt: string | null;
}

export function buildLearnerRows(
  learners: User[],
  purchases: Purchase[],
  seriesById: Map<string, TutorialSeries>,
  questionCounts: Record<string, number>
): LearnerRow[] {
  const purchasesByLearner = new Map<string, Purchase[]>();
  for (const p of purchases) {
    const list = purchasesByLearner.get(p.learner_id);
    if (list) list.push(p);
    else purchasesByLearner.set(p.learner_id, [p]);
  }

  return learners.map((user) => {
    const own = (purchasesByLearner.get(user.id) ?? [])
      .slice()
      .sort((a, b) => a.purchased_at.localeCompare(b.purchased_at));
    const seriesTitles = [
      ...new Set(
        own.map((p) => seriesById.get(p.series_id)?.title ?? "Unknown series")
      ),
    ];
    const totalSpent = own.reduce((sum, p) => sum + p.amount_paid, 0);
    return {
      user,
      purchases: own,
      seriesTitles,
      totalSpent,
      questionCount: questionCounts[user.id] ?? 0,
      lastPurchaseAt: own.length > 0 ? own[own.length - 1].purchased_at : null,
    };
  });
}

/** YYYY-MM-DD part of an ISO timestamp (matches <input type=date> values). */
function datePart(iso: string): string {
  return iso.slice(0, 10);
}

export function applySalesFilters(
  rows: LearnerRow[],
  f: SalesFilters
): LearnerRow[] {
  const q = f.q?.toLowerCase();
  const qPhone = f.q ? normalizePhone(f.q) : "";

  return rows.filter((row) => {
    if (q) {
      const nameHit = row.user.name.toLowerCase().includes(q);
      const phoneHit =
        qPhone.length > 0 &&
        normalizePhone(row.user.phone_number).includes(qPhone);
      if (!nameHit && !phoneHit) return false;
    }

    const registered = datePart(row.user.created_at);
    if (f.regFrom && registered < f.regFrom) return false;
    if (f.regTo && registered > f.regTo) return false;

    if (f.status === "paying" && row.purchases.length === 0) return false;
    if (f.status === "free" && row.purchases.length > 0) return false;

    if (
      f.seriesId &&
      !row.purchases.some((p) => p.series_id === f.seriesId)
    ) {
      return false;
    }

    if (f.purFrom || f.purTo) {
      const inRange = row.purchases.some((p) => {
        const purchased = datePart(p.purchased_at);
        if (f.purFrom && purchased < f.purFrom) return false;
        if (f.purTo && purchased > f.purTo) return false;
        return true;
      });
      if (!inRange) return false;
    }

    if (f.activity === "asked" && row.questionCount === 0) return false;
    if (f.activity === "never" && row.questionCount > 0) return false;

    return true;
  });
}
