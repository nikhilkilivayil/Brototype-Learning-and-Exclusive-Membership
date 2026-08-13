import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_MODE, db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Role, User } from "@/lib/types";

/** Demo-mode session cookie (which seeded user is "logged in"). */
export const SESSION_COOKIE = "portal_uid";
/**
 * Role hint cookie read by middleware for fast route guarding. It is set at
 * login in BOTH modes; server code always re-verifies via getCurrentUser().
 */
export const ROLE_COOKIE = "portal_role";

export const ROLE_HOME: Record<Role, string> = {
  learner: "/",
  admin: "/admin",
  support: "/support",
  sales: "/sales",
};

export function homePathForRole(role: Role): string {
  return ROLE_HOME[role] ?? "/";
}

/**
 * Only allow internal relative redirect targets (guards open redirects via
 * the login ?next= param). Returns null for anything unsafe.
 */
export function safeNext(next: string | null | undefined): string | null {
  if (!next) return null;
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")
    ? next
    : null;
}

/** Resolves the logged-in user (or null) for the current request. */
export async function getCurrentUser(): Promise<User | null> {
  if (DEMO_MODE) {
    const store = await cookies();
    const uid = store.get(SESSION_COOKIE)?.value;
    if (!uid) return null;
    return db.getUserById(uid);
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return db.getUserById(data.user.id);
}

/** Redirects to /login (preserving the return path) when not signed in. */
export async function requireUser(nextPath?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    const suffix = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${suffix}`);
  }
  return user;
}

/** Redirects away unless the current user has one of the given roles. */
export async function requireRole(
  roles: Role[],
  nextPath?: string
): Promise<User> {
  const user = await requireUser(nextPath);
  if (!roles.includes(user.role)) {
    redirect(homePathForRole(user.role));
  }
  return user;
}
