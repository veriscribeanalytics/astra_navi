import { getSession, signOut } from "next-auth/react";

/**
 * Enhanced fetch for client-side API calls.
 * Handles automatic session refresh and logout on 401 errors.
 */
export async function clientFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);

  if (response.status === 401) {
    // A 401 from our own API proxy means the session is invalid or expired.
    // Calling getSession() with no arguments in NextAuth v5 might not trigger a refresh 
    // if not configured, but our jwt callback handles rotation.
    
    const session = await getSession();
    
    // If we still get 401 after getting a fresh session (or if getSession returns null),
    // then the user must log in again.
    if (!session) {
      await signOut({ callbackUrl: "/login?error=SessionExpired" });
      throw new Error("Session expired. Please log in again.");
    }
    
    // Optional: Retry the request once if we think getSession() might have refreshed the token
    // But since the proxy routes call auth() which triggers refresh, a 401 usually means 
    // the refresh token itself is expired.
    
    await signOut({ callbackUrl: "/login?error=SessionExpired" });
    throw new Error("Session expired. Please log in again.");
  }

  return response;
}
