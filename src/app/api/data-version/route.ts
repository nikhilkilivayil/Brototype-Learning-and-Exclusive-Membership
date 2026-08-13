import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Never cache — this is the tiny endpoint clients poll for live updates.
export const dynamic = "force-dynamic";

/**
 * GET /api/data-version → { version }
 * The number increases on every write anywhere in the app (new question,
 * reply, purchase, admin edit…). LiveRefresher polls it and re-renders the
 * current page's server data when it changes.
 */
export async function GET() {
  const version = await db.getDataVersion();
  return NextResponse.json(
    { version },
    { headers: { "Cache-Control": "no-store" } }
  );
}
