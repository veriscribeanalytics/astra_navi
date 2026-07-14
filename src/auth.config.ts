import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";
import { isPublicRoute as isPublicRouteFn } from "@/lib/publicRoutes";

const SESSION_COOKIE_CHUNK_LIMIT = 20;

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

const GOOGLE_EXCHANGE_ERROR = "GoogleExchangeError";

function redirectToLoginAndClearSession(nextUrl: URL, errorCode: string, presentCookieNames: Set<string>) {
  const loginUrl = new URL("/login", nextUrl);
  loginUrl.searchParams.set("error", errorCode);
  loginUrl.searchParams.set("sessionCleared", "1");
  const response = Response.redirect(loginUrl);
  appendSessionClearCookies(response, nextUrl.hostname, presentCookieNames);
  return response;
}

function continueAndClearSession(nextUrl: URL, presentCookieNames: Set<string>) {
  const response = NextResponse.next();
  appendSessionClearCookies(response, nextUrl.hostname, presentCookieNames);
  return response;
}

/**
 * Parse the Cookie header into the set of cookie names actually present on the
 * request. Used so we only emit Set-Cookie deletions for cookies that exist —
 * deleting a cookie the browser never set is a no-op, and emitting ~336 of them
 * (4 names × 21 slots × up to 4 domain/path variants) blows past reverse-proxy
 * header limits (nginx default ~4–8 KB total header; some CDNs cap individual
 * header count far lower). Introspecting the real request collapses the storm
 * to typically ≤4 deletion headers.
 */
function parsePresentCookieNames(cookieHeader: string | null): Set<string> {
  const names = new Set<string>();
  if (!cookieHeader) return names;
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    const name = eq === -1 ? trimmed : trimmed.slice(0, eq);
    if (name) names.add(name);
  }
  return names;
}

function appendSessionClearCookies(
  response: Response,
  hostname: string,
  presentCookieNames: Set<string>
) {
  if (presentCookieNames.size === 0) return;

  const hostParts = hostname.split(".");
  const parentDomain = hostParts.length >= 2 ? "." + hostParts.slice(-2).join(".") : undefined;

  // Emit deletion for both host-only (dev) and domain-scoped (prod) variants.
  // Bounded by the cookies actually present (see parsePresentCookieNames), so
  // the worst case is O(present × variants) — never the old 4×21×4 = 336.
  const variants = [
    "Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; SameSite=Lax",
    "Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; Secure; SameSite=Lax",
    ...(parentDomain ? [
      `Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; Domain=${parentDomain}; HttpOnly; SameSite=Lax`,
      `Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; Domain=${parentDomain}; HttpOnly; Secure; SameSite=Lax`,
    ] : []),
  ];

  for (const name of SESSION_COOKIE_NAMES) {
    if (presentCookieNames.has(name)) {
      for (const attrs of variants) {
        response.headers.append("Set-Cookie", `${name}=; ${attrs}`);
      }
    }
    // Only emit chunk deletions (name.0, name.1, …) for chunk indices that
    // actually appear in the request. NextAuth only chunks when the JWT exceeds
    // the per-cookie size limit, so most requests carry zero chunks.
    for (let i = 0; i < SESSION_COOKIE_CHUNK_LIMIT; i += 1) {
      if (presentCookieNames.has(`${name}.${i}`)) {
        for (const attrs of variants) {
          response.headers.append("Set-Cookie", `${name}.${i}=; ${attrs}`);
        }
      }
    }
  }
}

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login", // Redirect back to login, we'll handle error display there
  },
  callbacks: {
    authorized({ auth, request }) {
      const nextUrl = request.nextUrl;
      const hasSessionError =
        auth?.user?.error === "TokenReuseError" ||
        auth?.user?.error === "RefreshAccessTokenError" ||
        auth?.user?.error === GOOGLE_EXCHANGE_ERROR;
      const isLoggedIn = !!auth?.user && !hasSessionError;
      const isApiRoute = nextUrl.pathname.startsWith("/api");
      const isAuthRoute = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
      const isPublicRoute = isPublicRouteFn(nextUrl.pathname);

      // Introspect the actual incoming Cookie header so the session-clear
      // helpers only emit Set-Cookie deletions for cookies that exist (see
      // appendSessionClearCookies). Keeps the response well under proxy header
      // limits instead of emitting ~336 deletion headers unconditionally.
      const presentCookieNames = parsePresentCookieNames(request.headers.get("cookie"));

      // Allow auth routes (login/register).  If the session has an error,
      // treat the user as not logged in so they stay on /login instead of
      // being redirected to /chat.
      if (isAuthRoute) {
        if (hasSessionError) {
          if (nextUrl.searchParams.get("sessionCleared") === "1") {
            return continueAndClearSession(nextUrl, presentCookieNames);
          }
          const code = auth?.user?.error === GOOGLE_EXCHANGE_ERROR ? "GoogleAuthFailed" : "SessionExpired";
          return redirectToLoginAndClearSession(nextUrl, code, presentCookieNames);
        }
        // NOTE: we intentionally do NOT auto-redirect logged-in users away
        // from /login. Doing so used to bounce anyone who opened a shared
        // /login link (with a stale cookie) to /chat, where they would see
        // a blank/dark screen if their session was in an inconsistent state.
        // The login page itself renders an "already signed in" banner when
        // appropriate. After sign-in, the form redirects to `callbackUrl`.
        return true;
      }

      // Session has a fatal error — redirect all non-API pages to login
      // so the poisoned cookie doesn't trap the user in a redirect loop.
      if (hasSessionError && !isApiRoute && !isPublicRoute) {
        const code = auth?.user?.error === GOOGLE_EXCHANGE_ERROR ? "GoogleAuthFailed" : "SessionExpired";
        return redirectToLoginAndClearSession(nextUrl, code, presentCookieNames);
      }

      // Protect all other routes except public ones and API routes
      // API routes handle their own auth
      if (!isLoggedIn && !isPublicRoute && !isApiRoute) {
        return false; // Redirects to login
      }

      return true;
    },
  },
  providers: [], // Add empty providers to satisfy type, will be populated in auth.ts
} satisfies NextAuthConfig;
