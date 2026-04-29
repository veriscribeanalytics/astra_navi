import { auth } from "@/lib/auth";

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
 * Returns a 401 Unauthorized response if no session is found.
 */
export function unauthorizedResponse() {
  return Response.json(
    { error: "Unauthorized. Please log in to your account." },
    { status: 401 }
  );
}
