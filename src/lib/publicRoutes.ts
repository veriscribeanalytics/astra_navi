/**
 * Single source of truth for "public" routes — pages that must be viewable
 * regardless of authentication state (logged-out, logged-in, or a poisoned/
 * expired session).
 *
 * This list is intentionally shared between:
 *   - the edge middleware (auth.config.ts) which decides server-side redirects,
 *   - AuthContext, which decides whether a fatal session error should hard-bounce
 *     the user to the login page, and
 *   - clientFetch (apiClient.ts), which decides whether a persistent 401 should
 *     force a global sign-out.
 *
 * Keeping these in sync matters: if the server treats /privacy as public but the
 * client still runs its "session expired -> sign out" logic there, the user sees
 * the page flash for a moment and then gets thrown to the login screen. Legal
 * pages in particular (privacy, terms) must never do that.
 *
 * Must stay edge-runtime safe — no Node APIs, pure string logic only.
 */

/** Path prefixes that are always public. Matched as exact or `${prefix}/...`. */
export const PUBLIC_ROUTE_PREFIXES = [
  "/blogs",
  "/about",
  "/support",
  "/careers",
  "/plans",
  "/services",
  "/horoscope",
  "/intro",
  "/privacy",
  "/terms",
  "/astrologers",
  "/forgot-password",
  "/reset-password",
  "/logout",
] as const;

/**
 * Returns true when `pathname` points at a public, auth-optional route.
 * The site root ("/") is public; everything else must match a prefix either
 * exactly or as a path segment boundary (so "/plans" and "/plans/pro" match,
 * but "/planshidden" does not).
 */
export function isPublicRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname === "/") return true;
  return PUBLIC_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
