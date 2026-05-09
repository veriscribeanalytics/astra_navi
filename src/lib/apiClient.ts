import { getSession, signOut } from "next-auth/react";
import type { Session } from "next-auth";

let sessionRefreshPromise: Promise<Session | null> | null = null;

// Track when the session first became authenticated to provide a grace period
// after login during which 401s are treated as timing issues rather than real expiry.
let authEstablishedAt: number | null = null;
const AUTH_GRACE_MS = 5000; // 5 seconds grace period after session is first detected

// Deduplicate sign-out calls so multiple concurrent 401s don't each trigger signOut
let signOutPromise: Promise<void> | null = null;

async function getRefreshedSession() {
  if (sessionRefreshPromise) {
    return sessionRefreshPromise;
  }
  sessionRefreshPromise = getSession();
  try {
    const session = await sessionRefreshPromise;
    // Mark when we first see an authenticated session
    if (session && !authEstablishedAt) {
      authEstablishedAt = Date.now();
    }
    return session;
  } finally {
    sessionRefreshPromise = null;
  }
}

/**
 * Check if we're within the grace period after login.
 * During this window, 401 errors are likely caused by the JWT cookie not yet
 * being available in server-side request cookies (race condition after signIn).
 */
function isWithinAuthGrace(): boolean {
  if (!authEstablishedAt) return false;
  return Date.now() - authEstablishedAt < AUTH_GRACE_MS;
}

/**
 * Perform sign-out with deduplication. If a sign-out is already in progress,
 * wait for it instead of triggering another one.
 */
async function performSignOut(callbackUrl: string, errorMessage: string): Promise<never> {
  if (!signOutPromise) {
    signOutPromise = signOut({ callbackUrl }).catch(err => {
      console.error("[clientFetch] signOut failed:", err);
    }).finally(() => {
      signOutPromise = null;
    });
  }
  await signOutPromise;
  throw new Error(errorMessage);
}

export async function clientFetch(input: RequestInfo | URL, init?: RequestInit & { _retry?: boolean }) {
  const body = init?.body;
  
  const isRequest = input instanceof Request;
  const requestToFetch = isRequest ? (input as Request).clone() : input;
  
  let response = await fetch(requestToFetch, init);

  if (response.status === 401 && !init?._retry) {
    const session = await getRefreshedSession();
    
    if (!session) {
      if (isWithinAuthGrace()) {
        // Session cookie might not be propagated yet — wait and retry once
        console.warn("[clientFetch] Got 401 during auth grace period. Waiting for cookie propagation...");
        await new Promise(resolve => setTimeout(resolve, 1500));
        const retrySession = await getRefreshedSession();
        if (retrySession) {
          console.warn("[clientFetch] Session appeared after grace wait. Retrying request.");
          const retryInit: RequestInit & { _retry: boolean } = { ...init, body, _retry: true };
          const retryRequest = isRequest ? (input as Request).clone() : input;
          response = await fetch(retryRequest, retryInit);
          if (response.status !== 401) return response;
          // Still 401 after grace retry — fall through to sign out
        }
      }
      await performSignOut("/login?error=SessionExpired", "Session expired. Please log in again.");
    }
    
    // Session exists at this point — check for refresh errors
    if (session?.user?.error === "RefreshAccessTokenError" || session?.user?.error === "TokenReuseError") {
      console.error("[clientFetch] Refresh failed with fatal error. Signing out immediately.");
      await performSignOut("/login?error=SessionExpired", "Session expired. Please log in again.");
    }

    // If we're in the grace period, wait a bit before retrying to give the cookie time to propagate
    if (isWithinAuthGrace()) {
      console.warn("[clientFetch] Got 401 during auth grace period. Waiting for cookie propagation before retry...");
      await new Promise(resolve => setTimeout(resolve, 1000));
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
       await performSignOut("/login?error=SessionExpired", "Session expired. Please log in again.");
    }
    
    return response;
  }

  if (response.status === 429 && !init?._retry) {
      console.error("[clientFetch] Rate limited (429). Redirecting to login to clear invalid state.");
      await performSignOut("/login?error=RateLimited", "Rate limit exceeded. Please log in again.");
  }

  return response;
}

// Exported for testing/reset purposes
export function resetAuthGrace() {
  authEstablishedAt = null;
}
