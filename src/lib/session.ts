import { auth } from "@/lib/auth";
import { getToken } from "next-auth/jwt";
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
 * The AUTH_SECRET is required by getToken() to decrypt the NextAuth JWT cookie.
 * NextAuth v5 prefers AUTH_SECRET over NEXTAUTH_SECRET.
 * If neither is set, token decryption will fail and all authenticated API calls
 * will return 401 from the backend (no Authorization header sent).
 */
const JWT_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

/**
 * Enhanced helper that also extracts the JWT token (containing access token)
 * which is no longer available on the client-side session for security.
 */
export async function getAuthContext(req: Request | NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    console.log("[getAuthContext] No session or no email. Session exists:", !!session, "User exists:", !!session?.user);
    return null;
  }
  
  if (!JWT_SECRET) {
    console.error("[getAuthContext] CRITICAL: No AUTH_SECRET or NEXTAUTH_SECRET env var set! getToken() cannot decrypt the JWT cookie. All authenticated API calls will fail with 401.");
    return {
      session,
      token: null,
      user: session.user,
      accessToken: undefined,
    };
  }

  const token = await getToken({ 
    req: req as NextRequest & Request,
    secret: JWT_SECRET,
  });
  
  // Diagnostic: verify token decryption worked and accessToken is present
  if (!token) {
    console.error("[getAuthContext] getToken() returned null! Session exists but JWT cookie cannot be decrypted. AUTH_SECRET may not match the one used to encrypt the cookie.");
  } else if (!token.accessToken) {
    console.error("[getAuthContext] Token decrypted but accessToken is missing! Token keys:", Object.keys(token));
  } else {
    console.log("[getAuthContext] Token OK. accessToken length:", (token.accessToken as string).length, "email:", session.user.email);
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
