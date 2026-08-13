import type { Db } from "./interface";
import { mockDb } from "./mock";
import { supabaseDb } from "./supabase-db";

/**
 * DEMO MODE runs the whole app against an in-memory seeded store — no
 * Supabase project or Razorpay account required. It is active when Supabase
 * env vars are absent, or when NEXT_PUBLIC_DEMO_MODE=true forces it.
 */
export const DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL;

export const db: Db = DEMO_MODE ? mockDb : supabaseDb;

export type { Db } from "./interface";
