import { NextResponse, type NextRequest } from "next/server";

const ROLE_COOKIE = "portal_role";

const ROLE_HOME: Record<string, string> = {
  learner: "/",
  admin: "/admin",
  support: "/support",
  sales: "/sales",
};

/** Path prefix → roles allowed in. Admin can peek at every back-office area. */
const PROTECTED: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/support", roles: ["support", "admin"] },
  { prefix: "/sales", roles: ["sales", "admin"] },
  { prefix: "/my-learning", roles: ["learner", "admin", "support", "sales"] },
];

/**
 * Fast route guard based on the role-hint cookie set at login. This is a UX
 * convenience only — every server action / page re-verifies the session with
 * requireRole()/requireUser() against the real session.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rule = PROTECTED.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)
  );
  if (!rule) return NextResponse.next();

  const role = request.cookies.get(ROLE_COOKIE)?.value;
  if (!role) {
    // A live session can outlast the 30-day role-hint cookie (demo uid
    // cookie, or a Supabase auth session). Redirecting those users to /login
    // would bounce them straight back out (the login page redirects
    // signed-in visitors), looping forever. Let the request through instead —
    // every protected page re-verifies with requireRole() anyway.
    const hasSession =
      Boolean(request.cookies.get("portal_uid")?.value) ||
      request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
    if (hasSession) {
      return NextResponse.next();
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  if (!rule.roles.includes(role)) {
    return NextResponse.redirect(new URL(ROLE_HOME[role] ?? "/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/support/:path*",
    "/sales/:path*",
    "/my-learning/:path*",
  ],
};
