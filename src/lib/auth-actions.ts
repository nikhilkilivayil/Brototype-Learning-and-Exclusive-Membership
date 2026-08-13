"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  homePathForRole,
  ROLE_COOKIE,
  safeNext,
  SESSION_COOKIE,
} from "@/lib/auth";
import { DEMO_MODE, db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

/**
 * Demo-mode sign-in: pick one of the seeded users. Rejected outright in
 * production mode.
 */
export async function loginAsDemoUser(
  userId: string,
  next?: string | null
): Promise<{ ok: boolean; error?: string }> {
  if (!DEMO_MODE) {
    return { ok: false, error: "Demo login is disabled in production mode." };
  }
  const user = await db.getUserById(userId);
  if (!user) return { ok: false, error: "Unknown demo user." };

  const store = await cookies();
  store.set(SESSION_COOKIE, user.id, COOKIE_OPTS);
  store.set(ROLE_COOKIE, user.role, COOKIE_OPTS);
  redirect(safeNext(next) ?? homePathForRole(user.role));
}

/**
 * Production mode: called AFTER the browser has verified the phone OTP with
 * Supabase. Ensures a `users` profile row exists for the auth user and sets
 * the role-hint cookie for middleware.
 */
export async function completeSupabaseLogin(
  name: string | null,
  next?: string | null
): Promise<{ ok: boolean; error?: string }> {
  if (DEMO_MODE) {
    return { ok: false, error: "Not available in demo mode." };
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return { ok: false, error: "No verified session found. Try again." };
  }

  let profile = await db.getUserById(data.user.id);
  if (!profile) {
    const phone = data.user.phone ? `+${data.user.phone}` : null;
    // Staff accounts (support/sales) are pre-created by the admin with just a
    // phone number — first OTP sign-in claims that profile (keeping its
    // role) by re-keying it to the auth user id. Everyone else self-registers
    // as a learner; staff roles can never be self-assigned.
    const preCreated = phone ? await db.getUserByPhone(phone) : null;
    if (preCreated) {
      profile = await db.relinkUserId(preCreated.id, data.user.id);
      if (name?.trim() && profile.name.trim() === "") {
        profile = await db.updateUser(profile.id, { name: name.trim() });
      }
    } else {
      profile = await db.createUser({
        id: data.user.id,
        name: name?.trim() || "Learner",
        phone_number: phone ?? "unknown",
        role: "learner",
      });
    }
  }

  const store = await cookies();
  store.set(ROLE_COOKIE, profile.role, COOKIE_OPTS);
  redirect(safeNext(next) ?? homePathForRole(profile.role));
}

/** Clears the session (both modes) and returns to the home page. */
export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(ROLE_COOKIE);
  if (!DEMO_MODE) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
