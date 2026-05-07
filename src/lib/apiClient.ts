import { getSession, signOut } from "next-auth/react";

/**
 * Enhanced fetch for client-side API calls.
 * Handles automatic session refresh and logout on 401 errors.
 */
export async function clientFetch(input: RequestInfo | URL, init?: RequestInit & { _retry?: boolean }) {
  // If the body is a string, it can be reused. If it's a stream, it gets consumed.
  // We explicitly preserve the body if it's a string or other reusable type.
  const body = init?.body;
  
  const isRequest = input instanceof Request;
  const requestToFetch = isRequest ? (input as Request).clone() : input;
  
  let response = await fetch(requestToFetch, init);

  if (response.status === 401 && !init?._retry) {
    // A 401 from our own API proxy means the backend rejected the access token.
    // Check if the NextAuth session is still valid before deciding to sign out.
    const session = await getSession();
    
    if (!session) {
      // No session at all — user truly isn't logged in
      await signOut({ callbackUrl: "/login?error=SessionExpired" });
      throw new Error("Session expired. Please log in again.");
    }
    
    // Check for explicit refresh failure flags from our auth callback
    if (session.user?.error === "RefreshAccessTokenError" || session.user?.error === "TokenReuseError") {
      console.error("[clientFetch] Refresh failed with fatal error. Signing out immediately.");
      await signOut({ callbackUrl: "/login?error=SessionExpired" });
      throw new Error("Session expired. Please log in again.");
    }
    
    // Session exists and refresh (if any) was successful. 
    // We should retry the request once.
    console.warn("[clientFetch] Got 401, but session is valid/refreshed. Retrying request once.");
    
    // Ensure we can reuse the body if it was a string
    const retryInit: RequestInit & { _retry: boolean } = { 
      ...init, 
      body,
      _retry: true 
    };

    // If headers is a plain object, it's already spread. 
    // If it's a Headers instance, we might need more care, but usually it's an object here.
    
    const retryRequest = isRequest ? (input as Request).clone() : input;
    response = await fetch(retryRequest, retryInit);
    
    if (response.status === 401) {
       console.error("[clientFetch] Retry also failed with 401. Tokens are out of sync. Forcing logout.");
       await signOut({ callbackUrl: "/login?error=SessionExpired" });
       throw new Error("Session expired. Please log in again.");
    }
    
    return response;
  }

  if (response.status === 429 && !init?._retry) {
      console.error("[clientFetch] Rate limited (429). Redirecting to login to clear invalid state.");
      await signOut({ callbackUrl: "/login?error=RateLimited" });
      throw new Error("Rate limit exceeded. Please log in again.");
  }

  return response;
}
