import { getSession, signOut } from "next-auth/react";
import type { Session } from "next-auth";

let sessionRefreshPromise: Promise<Session | null> | null = null;

async function getRefreshedSession() {
  if (sessionRefreshPromise) {
    return sessionRefreshPromise;
  }
  sessionRefreshPromise = getSession();
  try {
    return await sessionRefreshPromise;
  } finally {
    sessionRefreshPromise = null;
  }
}

export async function clientFetch(input: RequestInfo | URL, init?: RequestInit & { _retry?: boolean }) {
  const body = init?.body;
  
  const isRequest = input instanceof Request;
  const requestToFetch = isRequest ? (input as Request).clone() : input;
  
  let response = await fetch(requestToFetch, init);

  if (response.status === 401 && !init?._retry) {
    const session = await getRefreshedSession();
    
    if (!session) {
      await signOut({ callbackUrl: "/login?error=SessionExpired" });
      throw new Error("Session expired. Please log in again.");
    }
    
    if (session.user?.error === "RefreshAccessTokenError" || session.user?.error === "TokenReuseError") {
      console.error("[clientFetch] Refresh failed with fatal error. Signing out immediately.");
      await signOut({ callbackUrl: "/login?error=SessionExpired" });
      throw new Error("Session expired. Please log in again.");
    }
    
    console.warn("[clientFetch] Got 401, but session is valid/refreshed. Retrying request once.");
    
    const retryInit: RequestInit & { _retry: boolean } = { 
      ...init, 
      body,
      _retry: true 
    };

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
