import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_CHUNK_LIMIT = 20;

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

/**
 * Parse the request's Cookie header into the set of cookie names present, so we
 * only emit deletions for cookies that actually exist (deleting a never-set
 * cookie is a no-op, and emitting ~336 of them unconditionally can exceed
 * reverse-proxy header limits). Mirrors the same introspection in auth.config.ts.
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

/**
 * Dedicated route to clear ALL Auth.js / NextAuth session cookies and chunked
 * cookies.  Called from the login page when ?error=SessionExpired is detected
 * to prevent login-page reload loops from poisoned production cookies.
 *
 * Uses NextResponse.cookies.delete() which inherits the correct Domain/Path
 * attributes from the request, ensuring cookies are cleared in production
 * (where cookies may be set with Domain=.yourdomain.com). Only deletes cookies
 * actually present on the request — see parsePresentCookieNames — so the
 * response stays well within proxy header limits.
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  const present = parsePresentCookieNames(request.headers.get("cookie"));

  const host = request.headers.get("host") || "";
  const hostParts = host.split(":")[0].split(".");
  const parentDomain = hostParts.length >= 2
    ? "." + hostParts.slice(-2).join(".")
    : undefined;

  for (const name of SESSION_COOKIE_NAMES) {
    if (!present.has(name)) continue;
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
      if (!present.has(chunkedName)) continue;
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
