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
 * Enhanced helper that also extracts the JWT token (containing access token)
 * which is no longer available on the client-side session for security.
 */
export async function getAuthContext(req: Request | NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return null;
  }
  
  const token = await getToken({ req: req as NextRequest & Request });
  
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
