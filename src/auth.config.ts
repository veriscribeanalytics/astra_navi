import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

const SESSION_COOKIE_CHUNK_LIMIT = 20;

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

function redirectToLoginAndClearSession(nextUrl: URL) {
  const loginUrl = new URL("/login", nextUrl);
  loginUrl.searchParams.set("error", "SessionExpired");
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
        auth?.user?.error === "RefreshAccessTokenError";
      const isLoggedIn = !!auth?.user && !hasSessionError;
      const isApiRoute = nextUrl.pathname.startsWith("/api");
      const isAuthRoute = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
      const isSessionRecoveryRoute =
        nextUrl.searchParams.get("error") === "SessionExpired" ||
        nextUrl.searchParams.get("sessionCleared") === "1";
      const isPublicRoute = 
        nextUrl.pathname === "/" || 
        nextUrl.pathname.startsWith("/blogs") || 
        nextUrl.pathname.startsWith("/rashis") ||
        nextUrl.pathname.startsWith("/about") ||
        nextUrl.pathname.startsWith("/support") ||
        nextUrl.pathname.startsWith("/careers") ||
        nextUrl.pathname.startsWith("/plans") ||
        nextUrl.pathname.startsWith("/kundli") ||
        nextUrl.pathname.startsWith("/consult") ||
        nextUrl.pathname.startsWith("/forgot-password") ||
        nextUrl.pathname.startsWith("/reset-password") ||
        nextUrl.pathname.startsWith("/logout");

      // Allow auth routes (login/register).  If the session has an error,
      // treat the user as not logged in so they stay on /login instead of
      // being redirected to /chat.
      if (isAuthRoute) {
        if (hasSessionError) {
          if (nextUrl.searchParams.get("sessionCleared") === "1") {
            return continueAndClearSession(nextUrl);
          }
          return redirectToLoginAndClearSession(nextUrl);
        }
        if (isLoggedIn && !isSessionRecoveryRoute) {
          return Response.redirect(new URL("/chat", nextUrl));
        }
        return true;
      }

      // Session has a fatal error — redirect all non-API pages to login
      // so the poisoned cookie doesn't trap the user in a redirect loop.
      if (hasSessionError && !isApiRoute && !isPublicRoute) {
        return redirectToLoginAndClearSession(nextUrl);
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
