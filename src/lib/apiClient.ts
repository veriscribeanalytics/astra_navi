import { getSession, signOut } from "next-auth/react";
import type { Session } from "next-auth";

let sessionRefreshPromise: Promise<Session | null> | null = null;

// Track when the session first became authenticated to provide a grace period
// after login during which 401s are treated as timing issues rather than real expiry.
let authEstablishedAt: number | null = null;
const AUTH_GRACE_MS = 5000; // 5 seconds grace period after session is first detected

// Deduplicate sign-out calls so multiple concurrent 401s don't each trigger signOut
let signOutPromise: Promise<void> | null = null;

const SESSION_RECOVERY_URL = "/login?error=SessionExpired&sessionCleared=1";

// Upper bound on how long we'll wait for a Retry-After before giving up and
// returning the 429 to the caller. Anything longer is surfaced as a recoverable
// error rather than blocking the request.
const MAX_429_BACKOFF_MS = 4000;

/**
 * Parse a Retry-After header (delta-seconds or HTTP-date) into milliseconds.
 * Returns null when absent or unparseable.
 */
function parseRetryAfter(headerValue: string | null): number | null {
  if (!headerValue) return null;
  const seconds = Number(headerValue);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }
  const dateMs = Date.parse(headerValue);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }
  return null;
}

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
    signOutPromise = (async () => {
      try {
        await fetch("/api/auth/clear-session", { method: "POST" });
      } catch (err) {
        console.warn("[clientFetch] session clear failed before signOut:", err);
      }
      await signOut({ redirectTo: callbackUrl });
    })()
      .catch(err => {
        console.error("[clientFetch] signOut failed:", err);
      })
      .finally(() => {
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
      await performSignOut(SESSION_RECOVERY_URL, "Session expired. Please log in again.");
    }
    
    // Session exists at this point — check for refresh errors
    if (session?.user?.error === "RefreshAccessTokenError" || session?.user?.error === "TokenReuseError") {
      console.error("[clientFetch] Refresh failed with fatal error. Signing out immediately.");
      await performSignOut(SESSION_RECOVERY_URL, "Session expired. Please log in again.");
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
       await performSignOut(SESSION_RECOVERY_URL, "Session expired. Please log in again.");
    }
    
    return response;
  }

  // 402 = Payment Required — paywall/entitlement block.
  // This is NOT an auth failure. Do NOT sign out the user.
  // The calling code should handle 402 by parsing the paywall data
  // and showing a PaywallCard.
  // We let it pass through as a normal response so callers can detect it.

  // 429 = Too Many Requests. This is a TRANSIENT, recoverable condition, NOT an
  // auth failure — a rate limit is not cleared by logging in. Attempt a single
  // bounded backoff retry (honoring Retry-After when small), then return the
  // response so the calling hook can surface a recoverable error/retry UI.
  if (response.status === 429 && !init?._retry) {
    const retryAfterMs = parseRetryAfter(response.headers.get("retry-after"));
    if (retryAfterMs !== null && retryAfterMs <= MAX_429_BACKOFF_MS) {
      console.warn(`[clientFetch] Rate limited (429). Retrying once after ${retryAfterMs}ms.`);
      await new Promise(resolve => setTimeout(resolve, retryAfterMs));
      const retryInit: RequestInit & { _retry: boolean } = { ...init, body, _retry: true };
      const retryRequest = isRequest ? (input as Request).clone() : input;
      response = await fetch(retryRequest, retryInit);
    } else {
      console.warn("[clientFetch] Rate limited (429). Returning to caller for recoverable handling.");
    }
  }

  return response;
}

// Exported for testing/reset purposes
export function resetAuthGrace() {
  authEstablishedAt = null;
}

export { normalizeApiError, isPaywallError, isHardPaywall, isSoftPaywall, isAuthError, isCapacityError, isReservationPending, isFamilyError, isRateLimitError, isValidationError, shouldForceLogout, shouldTryRefresh, getAuthAction, extractPaywallData, getLocalizedApiError, ApiErrorCategory, AUTH_ACTIONS, API_ERROR_CODES } from './apiError';
export type { NormalizedApiError, AuthAction, ApiErrorCode, ValidationDetail } from './apiError';
