import { auth } from "@/lib/auth";
import { decode } from "next-auth/jwt";
import { NextRequest } from "next/server";

/**
 * Server-side helper to get the current session and verify the user is logged in.
 * Use this in Next.js API routes.
 */
export async function getAuthSession() {
  const session = await auth();
  if (!session?.user?.email) {
    return null;
  }
  return session;
}

/**
 * The AUTH_SECRET is required to decrypt the NextAuth JWT cookie.
 * NextAuth v5 prefers AUTH_SECRET over NEXTAUTH_SECRET.
 */
const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

/**
 * Cookie name variations to try when looking for the session token.
 * In production (HTTPS), NextAuth uses the __Secure- prefix.
 * In v5, the cookie prefix changed from "next-auth" to "authjs".
 * We try all variants to handle any environment configuration.
 */
const SESSION_COOKIE_NAMES = [
  "__Secure-authjs.session-token",   // v5 production (HTTPS)
  "authjs.session-token",            // v5 development (HTTP)
  "__Secure-next-auth.session-token", // v4 production (HTTPS) 
  "next-auth.session-token",          // v4 development (HTTP)
];

/**
 * Parse cookies from a Cookie header string into a simple key-value map.
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.substring(0, eqIndex);
    const value = trimmed.substring(eqIndex + 1);
    cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

/**
 * Find the session token value from request cookies.
 * Tries all known cookie name variants and handles chunked cookies.
 */
function findSessionToken(req: Request | NextRequest): { token: string; cookieName: string } | null {
  const cookieHeader = req.headers.get('cookie') || '';
  if (!cookieHeader) return null;
  
  const cookies = parseCookies(cookieHeader);
  
  for (const cookieName of SESSION_COOKIE_NAMES) {
    // Check for chunked cookies (e.g., cookieName.0, cookieName.1)
    const chunks: { index: number; value: string }[] = [];
    let hasChunks = false;
    
    for (const [name, value] of Object.entries(cookies)) {
      if (name === cookieName) {
        // Unchunked cookie found
        return { token: value, cookieName };
      }
      if (name.startsWith(cookieName + '.')) {
        const suffix = name.substring(cookieName.length + 1);
        const index = parseInt(suffix, 10);
        if (!isNaN(index)) {
          chunks.push({ index, value });
          hasChunks = true;
        }
      }
    }
    
    // Reassemble chunked cookie
    if (hasChunks && chunks.length > 0) {
      chunks.sort((a, b) => a.index - b.index);
      return { token: chunks.map(c => c.value).join(''), cookieName };
    }
  }
  
  return null;
}

/**
 * Enhanced helper that also extracts the JWT token (containing access token)
 * which is no longer available on the client-side session for security.
 * 
 * CRITICAL FIX: Previous implementation used getToken() from next-auth/jwt,
 * which failed in production because it didn't detect the __Secure- cookie
 * prefix automatically. This implementation reads the cookie directly from
 * the request and decodes it using @auth/core/jwt's decode() function,
 * trying all known cookie name variants.
 */
export async function getAuthContext(req: Request | NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return null;
  }
  
  if (!JWT_SECRET) {
    console.error("[getAuthContext] CRITICAL: No AUTH_SECRET or NEXTAUTH_SECRET env var set! Cannot decrypt JWT cookie. All authenticated API calls will fail with 401.");
    return {
      session,
      token: null,
      user: session.user,
      accessToken: undefined,
    };
  }

  // Find the session token from the request cookies
  const sessionToken = findSessionToken(req);
  
  if (!sessionToken) {
    console.error("[getAuthContext] No session cookie found in request. Tried:", SESSION_COOKIE_NAMES.join(', '));
    return {
      session,
      token: null,
      user: session.user,
      accessToken: undefined,
    };
  }

  // Decode the JWT using the correct salt (= cookie name, as per Auth.js convention)
  const token = await decode({
    token: sessionToken.token,
    secret: JWT_SECRET,
    salt: sessionToken.cookieName,
  });
  
  if (!token) {
    console.error("[getAuthContext] JWT decode returned null! Cookie found as:", sessionToken.cookieName, "but decryption failed. AUTH_SECRET may not match the one used to encrypt the cookie.");
  } else if (!token.accessToken) {
    console.error("[getAuthContext] JWT decoded but accessToken is missing! Token keys:", Object.keys(token));
  }
  
  return {
    session,
    token,
    user: session.user,
    accessToken: token?.accessToken as string | undefined,
  };
}

/**
 * Returns a 401 Unauthorized response if no session is found.
 */
export function unauthorizedResponse() {
  return Response.json(
    { error: "Unauthorized. Please log in to your account." },
    { status: 401 }
  );
}
