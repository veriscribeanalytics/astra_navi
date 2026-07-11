import { createHash } from 'crypto';
import { getRedis } from './redis';

// Server-only: this module holds refresh-token logic and must never ship to the
// browser. `redis.ts` (our dependency) relies on the same guarantee. We use a
// runtime guard rather than the `server-only` package so the pure helpers stay
// unit-testable in a plain Node (Playwright) context — matching backendClient.ts.
if (typeof window !== 'undefined') {
  throw new Error('refreshCache can only be used on the server.');
}

/**
 * Minimal subset of the Upstash Redis client this module needs. Kept as an
 * interface so tests can inject an in-memory fake via `__setRedisForTest`
 * without standing up a real Redis.
 */
interface RedisLike {
  get<T>(key: string): Promise<T | null>;
  set(
    key: string,
    value: unknown,
    opts?: { px?: number; nx?: boolean }
  ): Promise<unknown>;
  del(key: string): Promise<unknown>;
}

// Test seam: when set, used instead of the real Upstash client.
let redisOverride: RedisLike | null = null;

function client(): RedisLike {
  return redisOverride ?? (getRedis() as unknown as RedisLike);
}

/**
 * Cross-instance refresh-token rotation cache.
 *
 * WHY THIS EXISTS
 * ---------------
 * Refresh-token rotation is single-use: presenting refresh token T1 rotates it
 * to T2 and REVOKES T1. If the same T1 is presented twice, the backend's reuse
 * detection fires and force-logs-out the user (401 → catalog retry storm).
 *
 * The NextAuth `jwt` callback already single-flights concurrent refreshes, but
 * only *in process memory* (`refreshPromises` Map in auth.ts). That cannot
 * coordinate across:
 *   - multiple serverless instances (Vercel spins up N Node lambdas),
 *   - multiple browser tabs / SSR + client, each hitting /api/auth/session.
 * So two instances can each read the same not-yet-rotated JWT cookie, both send
 * T1, and the second trips reuse detection ~seconds apart.
 *
 * This module adds a SHARED (Redis) guard keyed by the OLD refresh token:
 *   1. First caller acquires a short lock and performs the real rotation, then
 *      publishes the resulting {accessToken, refreshToken, ...} to the cache.
 *   2. A concurrent caller that lost the lock waits briefly and reads the
 *      published result — reusing T2 instead of re-sending T1.
 *   3. A caller arriving after the fact (within the cache TTL) also gets the
 *      cached pair, covering the ~5s "cookie hasn't propagated yet" window.
 *
 * EVERYTHING HERE IS BEST-EFFORT. If Redis is unconfigured or throws, every
 * function degrades to "no cache / no lock" so the caller falls back to the
 * existing in-memory path. Redis must never be able to block a login.
 */

export interface RotatedTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
  profileComplete?: boolean;
}

// How long a freshly rotated pair stays readable by stragglers still holding
// the old token. Must comfortably exceed the observed reuse gap (~5s) and the
// in-memory success cache (10s in auth.ts) so the two layers agree.
const ROTATION_TTL_MS = 30_000;

// Lock lifetime — an upper bound on one backend /api/auth/refresh round-trip.
// If the lock holder dies mid-refresh, the lock expires and another caller
// retries rather than deadlocking. Kept below backendClient's 20s timeout.
const LOCK_TTL_MS = 12_000;

// How long a lock-loser waits for the winner to publish the rotated pair
// before giving up and doing its own refresh. Sum of a few short polls.
const WAIT_TIMEOUT_MS = 8_000;
const POLL_INTERVAL_MS = 200;

const CACHE_PREFIX = 'authrot:v1:';
const LOCK_PREFIX = 'authrotlock:v1:';

/**
 * Derive a stable, non-reversible cache key from a refresh token. We never use
 * the raw token as a Redis key — it would put a live credential in logs/keyspace.
 */
function keyFor(oldRefreshToken: string): string {
  const digest = createHash('sha256').update(oldRefreshToken).digest('hex');
  return digest.slice(0, 32);
}

/**
 * Look up a previously published rotation for this old refresh token.
 * Returns null on miss OR any Redis error (best-effort).
 */
export async function getCachedRotation(
  oldRefreshToken: string
): Promise<RotatedTokens | null> {
  try {
    const redis = client();
    const cached = await redis.get<RotatedTokens>(CACHE_PREFIX + keyFor(oldRefreshToken));
    // @upstash/redis auto-deserializes JSON; guard shape defensively.
    if (cached && typeof cached === 'object' && 'accessToken' in cached) {
      return cached as RotatedTokens;
    }
    return null;
  } catch (err) {
    console.warn('[refreshCache] getCachedRotation failed (ignoring):', err);
    return null;
  }
}

/**
 * Publish the result of a successful rotation so concurrent/straggling callers
 * holding the same old token can reuse it. Best-effort; failure is swallowed.
 */
export async function setCachedRotation(
  oldRefreshToken: string,
  tokens: RotatedTokens
): Promise<void> {
  try {
    const redis = client();
    await redis.set(CACHE_PREFIX + keyFor(oldRefreshToken), tokens, {
      px: ROTATION_TTL_MS,
    });
  } catch (err) {
    console.warn('[refreshCache] setCachedRotation failed (ignoring):', err);
  }
}

/**
 * Try to become the single instance that performs the real rotation for this
 * old token. Returns true if we acquired the lock, false if someone else holds
 * it. On any Redis error returns true so the caller proceeds unguarded (the
 * backend + in-memory guard remain as backstops) rather than stalling.
 */
export async function acquireRefreshLock(oldRefreshToken: string): Promise<boolean> {
  try {
    const redis = client();
    const result = await redis.set(LOCK_PREFIX + keyFor(oldRefreshToken), '1', {
      nx: true,
      px: LOCK_TTL_MS,
    });
    return result === 'OK';
  } catch (err) {
    console.warn('[refreshCache] acquireRefreshLock failed (proceeding unguarded):', err);
    return true;
  }
}

/**
 * Release a lock we acquired (call after publishing the rotation). Best-effort.
 */
export async function releaseRefreshLock(oldRefreshToken: string): Promise<void> {
  try {
    const redis = client();
    await redis.del(LOCK_PREFIX + keyFor(oldRefreshToken));
  } catch (err) {
    console.warn('[refreshCache] releaseRefreshLock failed (ignoring):', err);
  }
}

/**
 * Lock-loser path: poll the cache until the winner publishes the rotated pair,
 * or until WAIT_TIMEOUT_MS elapses. Returns the pair, or null if it never
 * appeared (caller should then fall back to its own refresh attempt).
 */
export async function waitForRotation(
  oldRefreshToken: string
): Promise<RotatedTokens | null> {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    const cached = await getCachedRotation(oldRefreshToken);
    if (cached) return cached;
  }
  return null;
}

// Exposed for testing.
export function __setRedisForTest(fake: RedisLike | null): void {
  redisOverride = fake;
}
export const __test = { keyFor, ROTATION_TTL_MS, LOCK_TTL_MS, WAIT_TIMEOUT_MS };
