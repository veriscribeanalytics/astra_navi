import { getSession, signOut } from "next-auth/react";

/**
 * Enhanced fetch for client-side API calls.
 * Handles automatic session refresh and logout on 401 errors.
 */
export async function clientFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);

  if (response.status === 401) {
    // A 401 from our own API proxy means the backend rejected the access token.
    // Check if the NextAuth session is still valid before deciding to sign out.
    const session = await getSession();
    
    if (!session) {
      // No session at all — user truly isn't logged in
      await signOut({ callbackUrl: "/login?error=SessionExpired" });
      throw new Error("Session expired. Please log in again.");
    }
    
    // Session exists but the backend rejected the token.
    // This can happen when:
    //   1. The access token hasn't propagated yet (race condition after login)
    //   2. The backend's token validation is stricter than expected
    //   3. The access token expired but the refresh token is still valid
    //
    // DO NOT sign out immediately — let the JWT callback handle token refresh.
    // If the session truly has an error, AuthContext will detect session.user.error
    // and handle it there with proper user feedback.
    console.warn("[clientFetch] Got 401 but session is still valid. Backend may have rejected the token. Returning response as-is.");
    
    // Return the 401 response so the caller can handle it gracefully
    return response;
  }

  return response;
}
