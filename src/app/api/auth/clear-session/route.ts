import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_CHUNK_LIMIT = 20;

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

/**
 * Dedicated route to clear ALL Auth.js / NextAuth session cookies and chunked
 * cookies.  Called from the login page when ?error=SessionExpired is detected
 * to prevent login-page reload loops from poisoned production cookies.
 *
 * Uses NextResponse.cookies.delete() which inherits the correct Domain/Path
 * attributes from the request, ensuring cookies are cleared in production
 * (where cookies may be set with Domain=.yourdomain.com).
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  const host = request.headers.get("host") || "";
  const hostParts = host.split(":")[0].split(".");
  const parentDomain = hostParts.length >= 2
    ? "." + hostParts.slice(-2).join(".")
    : undefined;

  for (const name of SESSION_COOKIE_NAMES) {
    response.cookies.delete(name);
    if (parentDomain) {
      response.cookies.set(name, "", {
        maxAge: 0,
        path: "/",
        domain: parentDomain,
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      });
    }
    for (let i = 0; i < SESSION_COOKIE_CHUNK_LIMIT; i += 1) {
      const chunkedName = `${name}.${i}`;
      response.cookies.delete(chunkedName);
      if (parentDomain) {
        response.cookies.set(chunkedName, "", {
          maxAge: 0,
          path: "/",
          domain: parentDomain,
          httpOnly: true,
          secure: true,
          sameSite: "lax",
        });
      }
    }
  }

  return response;
}
