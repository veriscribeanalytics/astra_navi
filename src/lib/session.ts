import { decode } from "next-auth/jwt";
import { NextRequest } from "next/server";

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
 * Server-side helper to get the current session.
 * Uses auth() which triggers the NextAuth jwt/session callback chain.
 * Only use this when you need the full NextAuth session object (e.g. for middleware).
 */
export async function getAuthSession() {
  // Lazy import to avoid circular dependency
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  if (!session?.user?.email) {
    return null;
  }
  return session;
}

/**
 * Get auth context for API routes by decoding the JWT directly from the request.
 * 
 * IMPORTANT: This does NOT call auth() to avoid triggering the jwt callback,
 * which would attempt a token refresh. Multiple concurrent API calls each
 * triggering auth() → jwt callback → refreshAccessToken() causes a race
 * condition where one refresh succeeds but others hit "token reuse detected"
 * (401), which then corrupts the JWT cookie with TokenReuseError.
 * 
 * Instead, we decode the JWT cookie directly and extract the accessToken.
 * If the accessToken is expired, we perform a single refresh here with
 * proper deduplication, and return the refreshed token.
 */
let refreshPromise: Promise<{ accessToken: string; refreshToken: string; accessTokenExpires: number } | null> | null = null;

async function refreshAccessTokenDirect(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; accessTokenExpires: number } | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const backendUrl = process.env.AI_BACKEND_URL;
      if (!backendUrl) {
        console.error("[getAuthContext] AI_BACKEND_URL not configured");
        return null;
      }

      const response = await fetch(`${backendUrl}/api/auth/refresh`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-API-Key": process.env.AI_BACKEND_API_KEY || '',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[getAuthContext] Direct refresh failed:", response.status, errorData);
        return null;
      }

      const data = await response.json();
      const expiresIn = (typeof data.expiresIn === 'number' && data.expiresIn > 0) 
        ? data.expiresIn 
        : 3600;

      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || refreshToken,
        accessTokenExpires: Date.now() + expiresIn * 1000,
      };
    } catch (error) {
      console.error("[getAuthContext] Direct refresh error:", error);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function getAuthContext(req: Request | NextRequest) {
  if (!JWT_SECRET) {
    console.error("[getAuthContext] CRITICAL: No AUTH_SECRET or NEXTAUTH_SECRET env var set! Cannot decrypt JWT cookie.");
    return null;
  }

  // Find the session token from the request cookies
  const sessionToken = findSessionToken(req);
  
  if (!sessionToken) {
    console.error("[getAuthContext] No session cookie found in request. Tried:", SESSION_COOKIE_NAMES.join(', '));
    return null;
  }

  // Decode the JWT using the correct salt (= cookie name, as per Auth.js convention)
  const token = await decode({
    token: sessionToken.token,
    secret: JWT_SECRET,
    salt: sessionToken.cookieName,
  });
  
  if (!token) {
    console.error("[getAuthContext] JWT decode returned null! Cookie found as:", sessionToken.cookieName, "but decryption failed.");
    return null;
  }

  if (!token.email) {
    console.error("[getAuthContext] JWT decoded but email is missing! Token keys:", Object.keys(token));
    return null;
  }

  // If the JWT has an error flag, the token chain is corrupted.
  // Don't attempt to use it — return null so the client can handle it.
  if (token.error) {
    console.error("[getAuthContext] JWT has error flag:", token.error, "— token chain is corrupted.");
    return null;
  }

  // Check if accessToken is present
  let accessToken = token.accessToken as string | undefined;
  let currentRefreshToken = token.refreshToken as string | undefined;

  if (!accessToken) {
    console.error("[getAuthContext] JWT decoded but accessToken is missing! Token keys:", Object.keys(token));
    return null;
  }

  // If accessToken is expired, try to refresh it directly (with deduplication)
  const expiresAt = token.accessTokenExpires as number;
  if (typeof expiresAt === 'number' && Date.now() >= expiresAt && currentRefreshToken) {
    console.warn("[getAuthContext] Access token expired. Attempting direct refresh...");
    const refreshed = await refreshAccessTokenDirect(currentRefreshToken);
    if (refreshed) {
      accessToken = refreshed.accessToken;
      currentRefreshToken = refreshed.refreshToken;
    } else {
      console.error("[getAuthContext] Direct refresh failed. Returning null — client will need to re-authenticate.");
      return null;
    }
  }

  return {
    user: {
      id: token.id as string,
      email: token.email as string,
      name: token.name as string | undefined,
    },
    accessToken,
    refreshToken: currentRefreshToken,
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
