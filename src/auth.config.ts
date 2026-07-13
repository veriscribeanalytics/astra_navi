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

function redirectToLoginAndClearSession(nextUrl: URL, errorCode?: string) {
  const loginUrl = new URL("/login", nextUrl);
  loginUrl.searchParams.set("error", errorCode || "SessionExpired");
  loginUrl.searchParams.set("sessionCleared", "1");
  const response = Response.redirect(loginUrl);
  appendSessionClearCookies(response, nextUrl.hostname);
  return response;
}

function continueAndClearSession(nextUrl: URL) {
  const response = NextResponse.next();
  appendSessionClearCookies(response, nextUrl.hostname);
  return response;
}

function appendSessionClearCookies(response: Response, hostname: string) {
  const hostParts = hostname.split(".");
  const parentDomain = hostParts.length >= 2 ? "." + hostParts.slice(-2).join(".") : undefined;

  // Emit deletion for both host-only (dev) and domain-scoped (prod) variants
  const variants = [
    "Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; SameSite=Lax",
    "Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; Secure; SameSite=Lax",
    ...(parentDomain ? [
      `Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; Domain=${parentDomain}; HttpOnly; SameSite=Lax`,
      `Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; Domain=${parentDomain}; HttpOnly; Secure; SameSite=Lax`,
    ] : []),
  ];

  for (const name of SESSION_COOKIE_NAMES) {
    for (const attrs of variants) {
      response.headers.append("Set-Cookie", `${name}=; ${attrs}`);
    }
    for (let i = 0; i < SESSION_COOKIE_CHUNK_LIMIT; i += 1) {
      for (const attrs of variants) {
        response.headers.append("Set-Cookie", `${name}.${i}=; ${attrs}`);
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
    authorized({ auth, request: { nextUrl } }) {
      const hasSessionError =
        auth?.user?.error === "TokenReuseError" ||
        auth?.user?.error === "RefreshAccessTokenError" ||
        auth?.user?.error === GOOGLE_EXCHANGE_ERROR;
      const isLoggedIn = !!auth?.user && !hasSessionError;
      const isApiRoute = nextUrl.pathname.startsWith("/api");
      const isAuthRoute = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
      const isPublicRoute = isPublicRouteFn(nextUrl.pathname);

      // Allow auth routes (login/register).  If the session has an error,
      // treat the user as not logged in so they stay on /login instead of
      // being redirected to /chat.
      if (isAuthRoute) {
        if (hasSessionError) {
          if (nextUrl.searchParams.get("sessionCleared") === "1") {
            return continueAndClearSession(nextUrl);
          }
          const code = auth?.user?.error === GOOGLE_EXCHANGE_ERROR ? "GoogleAuthFailed" : "SessionExpired";
          return redirectToLoginAndClearSession(nextUrl, code);
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
        return redirectToLoginAndClearSession(nextUrl, code);
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
