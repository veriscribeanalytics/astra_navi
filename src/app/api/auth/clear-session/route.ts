import { NextResponse } from "next/server";

const SESSION_COOKIE_CHUNK_LIMIT = 20;

/**
 * Dedicated route to clear ALL Auth.js / NextAuth session cookies and chunked
 * cookies.  Called from the login page when ?error=SessionExpired is detected
 * to prevent login-page reload loops from poisoned production cookies.
 *
 * This mirrors the cookie-clearing logic in auth.config.ts
 * (redirectToLoginAndClearSession / appendSessionClearCookies).
 */
export async function POST() {
  const response = NextResponse.json({ success: true });

  const expiredCookie = "Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; SameSite=Lax";
  const expiredSecureCookie = "Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; Secure; SameSite=Lax";

  // Clear all known Auth.js/NextAuth session cookie names and their chunked
  // variants (up to 5 chunks).  Chunked cookies are used for large JWT tokens
  // that exceed the 4096-byte browser cookie limit.
  for (const name of [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
  ]) {
    response.headers.append("Set-Cookie", `${name}=; ${expiredCookie}`);
    response.headers.append("Set-Cookie", `${name}=; ${expiredSecureCookie}`);
    for (let i = 0; i < SESSION_COOKIE_CHUNK_LIMIT; i += 1) {
      response.headers.append("Set-Cookie", `${name}.${i}=; ${expiredCookie}`);
      response.headers.append("Set-Cookie", `${name}.${i}=; ${expiredSecureCookie}`);
    }
  }

  return response;
}
