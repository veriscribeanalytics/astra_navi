/**
 * Pure classification of refresh-token failures as FATAL vs TRANSIENT.
 *
 * Extracted from src/lib/auth.ts so it can be unit-tested in a plain-Node
 * (Playwright) context WITHOUT importing next-auth / next/server — the full
 * NextAuth config in auth.ts is a server-only module that cannot load under
 * the Playwright test runner. Same pattern as sessionNonce.ts (pure helpers,
 * server-only guard at the top of the importing module).
 *
 * FATAL: the refresh token is revoked / expired / reused — the backend says the
 * token itself is no longer trustworthy. No retry can recover it; the session
 * must be torn down (TokenReuseError persisted → sign out).
 *
 * TRANSIENT: anything else — network error, 5xx, and crucially **429 Too Many
 * Requests**. The backend temporarily throttled us; the token is still valid.
 * Treating 429 as fatal used to sign a valid user out the instant the backend
 * rate-limited a refresh. See tests/refresh-error.spec.ts for the pinned cases.
 */
export function isRefreshFailureFatal(error: unknown): boolean {
  const err = (error ?? {}) as Record<string, unknown>;
  const errorCode = err?.code || (err?.error as Record<string, unknown>)?.code;
  return (
    ["token_reuse_detected", "token_expired", "token_invalid"].includes(errorCode as string) ||
    err?.error === "Token reuse detected" ||
    err?.detail === "Token reuse detected" ||
    err?.message === "Token reuse detected" ||
    err?.status === 401
  );
}
