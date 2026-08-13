import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  applySalesFilters,
  buildLearnerRows,
  parseSalesFilters,
} from "../filters";

/**
 * GET /sales/export — CSV download of registered LEARNERS (never staff
 * accounts) with purchase and doubt-activity aggregates. Honors the exact
 * same query-string filters as the /sales dashboard, so "Export CSV" always
 * downloads what's on screen. Sales/admin only (403 otherwise — no redirect
 * helpers here since this is a file download, not a page).
 */

/**
 * Wraps a field in double quotes, doubling any inner quotes (RFC 4180).
 * Fields starting with = + - @ (or tab/CR) are prefixed with a single quote
 * so spreadsheet apps treat them as text, not formulas — user-supplied names
 * would otherwise be a CSV-injection vector against the sales team.
 */
function csvField(value: string | number): string {
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user || !["sales", "admin"].includes(user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(request.url);
  const rawParams: Record<string, string | undefined> = {};
  url.searchParams.forEach((value, key) => {
    if (!(key in rawParams)) rawParams[key] = value;
  });
  const filters = parseSalesFilters(rawParams);

  // Learners only — the export must never leak admin/support/sales accounts.
  const [learners, purchases, series, questionCounts] = await Promise.all([
    db.listUsersByRole("learner"),
    db.listPurchases(),
    db.listSeries(),
    db.countQuestionsByLearner(),
  ]);

  const seriesById = new Map(series.map((s) => [s.id, s]));
  const allRows = buildLearnerRows(
    learners,
    purchases,
    seriesById,
    questionCounts
  ).sort(
    (a, b) =>
      new Date(b.user.created_at).getTime() -
      new Date(a.user.created_at).getTime()
  );
  const rows = applySalesFilters(allRows, filters);

  const header =
    "id,name,phone_number,registered_at,purchase_count,series_purchased," +
    "total_spent_inr,questions_asked,last_purchase_at";
  const lines = rows.map((row) =>
    [
      row.user.id,
      row.user.name,
      row.user.phone_number,
      row.user.created_at,
      row.purchases.length,
      row.seriesTitles.join("; "),
      row.totalSpent,
      row.questionCount,
      row.lastPurchaseAt ?? "",
    ]
      .map(csvField)
      .join(",")
  );

  const csv = [header, ...lines].join("\r\n") + "\r\n";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="registered-learners.csv"',
    },
  });
}
