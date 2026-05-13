import type { NextAuthConfig } from "next-auth";

function redirectToLoginAndClearSession(nextUrl: URL) {
  const loginUrl = new URL("/login", nextUrl);
  loginUrl.searchParams.set("error", "SessionExpired");
  loginUrl.searchParams.set("sessionCleared", "1");
  const response = Response.redirect(loginUrl);
  appendSessionClearCookies(response);
  return response;
}

function appendSessionClearCookies(response: Response) {
  const expiredCookie = "Max-Age=0; Path=/; HttpOnly; SameSite=Lax";
  const expiredSecureCookie = "Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax";

  for (const name of [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
  ]) {
    response.headers.append("Set-Cookie", `${name}=; ${expiredCookie}`);
    response.headers.append("Set-Cookie", `${name}=; ${expiredSecureCookie}`);
    for (let i = 0; i < 5; i += 1) {
      response.headers.append("Set-Cookie", `${name}.${i}=; ${expiredCookie}`);
      response.headers.append("Set-Cookie", `${name}.${i}=; ${expiredSecureCookie}`);
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
      const isPublicRoute = 
        nextUrl.pathname === "/" || 
        nextUrl.pathname.startsWith("/blogs") || 
        nextUrl.pathname.startsWith("/rashis") ||
        nextUrl.pathname.startsWith("/about") ||
        nextUrl.pathname.startsWith("/support") ||
        nextUrl.pathname.startsWith("/careers") ||
        nextUrl.pathname.startsWith("/plans") ||
        nextUrl.pathname.startsWith("/kundli") ||
        nextUrl.pathname.startsWith("/chat") ||
        nextUrl.pathname.startsWith("/consult");

      // Allow auth routes (login/register).  If the session has an error,
      // treat the user as not logged in so they stay on /login instead of
      // being redirected to /chat.
      if (isAuthRoute) {
        if (hasSessionError) {
          if (nextUrl.searchParams.get("sessionCleared") === "1") {
            return true;
          }
          return redirectToLoginAndClearSession(nextUrl);
        }
        if (isLoggedIn) {
          return Response.redirect(new URL("/chat", nextUrl));
        }
        return true;
      }

      // Session has a fatal error — redirect all non-API pages to login
      // so the poisoned cookie doesn't trap the user in a redirect loop.
      if (hasSessionError && !isApiRoute) {
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
