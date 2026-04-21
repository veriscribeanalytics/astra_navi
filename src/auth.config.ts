import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login", // Redirect back to login, we'll handle error display there
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isApiRoute = nextUrl.pathname.startsWith("/api");
      const isAuthRoute = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
      const isPublicRoute = nextUrl.pathname === "/" || nextUrl.pathname.startsWith("/blogs") || nextUrl.pathname.startsWith("/rashis");

      // Redirect logged-in users away from login/register
      if (isAuthRoute) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/chat", nextUrl));
        }
        return true;
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
