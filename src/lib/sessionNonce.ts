import { randomBytes } from 'crypto';
import { getRedis } from './redis';

// Server-only: holds live backend access/refresh tokens. Must never ship to the
// browser. Same runtime-guard style as refreshCache.ts / backendClient.ts so the
// pure helpers stay unit-testable in a plain-Node (Playwright) context.
if (typeof window !== 'undefined') {
  throw new Error('sessionNonce can only be used on the server.');
}

/**
 * Single-use server-validated session-creation nonce.
 *
 * WHY THIS EXISTS
 * ---------------
 * Before this module, registration created an Auth.js session by trusting
 * browser-supplied identity: the client POSTed to /api/register, the route
 * returned the backend's `accessToken` + `refreshToken` to the browser, and the
 * client handed them straight back to `signIn('credentials', { isRegistration,
 * id, accessToken, refreshToken })`. `authorize()` then adopted those values
 * verbatim without ever calling the backend — so a DevTools-forged payload
 * produced a valid session for an attacker-chosen identity. (The login path had
 * a parallel weakness: it called the backend twice, and the session-creating
 * call bypassed the rate-limited BFF proxy.)
 *
 * This module closes both. The BFF route (register OR login) is the ONLY thing
 * that talks to the backend and obtains real tokens. It stores them here under a
 * random nonce with a short TTL, returns ONLY `{ nonce, user, profileComplete }`
 * to the browser, and the client calls `signIn('credentials', { sessionNonce })`.
 * `authorize()` looks up the nonce and DELETES it (single-use), adopting the
 * server-fetched identity. A forged or replayed nonce can never mint a session.
 *
 * The browser never sees a token. Identity cannot be client-influenced. And the
 * session-creating call is the rate-limited BFF call — one backend round-trip.
 */

const NONCE_PREFIX = 'authnonce:v1:';
const NONCE_TTL_MS = 60_000; // 60s — enough for the client to call signIn()

export interface NoncePayload {
  id: string;
  email: string | null;
  name: string;
  image?: string | null;
  phoneNumber?: string | null;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  profileComplete?: boolean;
}

interface RedisLike {
  get<T>(key: string): Promise<T | null>;
  // GETDEL: atomically returns the value AND deletes the key in one round-trip.
  // Upstash's REST client exposes this as `redis.getdel<TData>(key)`.
  getdel<T>(key: string): Promise<T | null>;
  set(
    key: string,
    value: unknown,
    opts?: { px?: number; nx?: boolean }
  ): Promise<unknown>;
  del(key: string): Promise<unknown>;
}

// Test seam.
let redisOverride: RedisLike | null = null;
function client(): RedisLike {
  return redisOverride ?? (getRedis() as unknown as RedisLike);
}

/** Generate a cryptographically random nonce (URL-safe base64, 24 bytes). */
export function generateSessionNonce(): string {
  return randomBytes(24).toString('base64url');
}

/**
 * Store the session payload under a fresh nonce. The caller (BFF route) returns
 * only the nonce to the browser. Best-effort: if Redis is unreachable we throw,
 * because session creation must NOT fall back to trusting client-submitted
 * tokens — that is precisely the bypass we are closing. Failing the request
 * closed (the browser shows an error and the user retries) is safe; silently
 * adopting client identity is not.
 */
export async function createSessionNonce(
  payload: NoncePayload
): Promise<string> {
  const nonce = generateSessionNonce();
  await client().set(NONCE_PREFIX + nonce, payload, { px: NONCE_TTL_MS });
  return nonce;
}

/**
 * Consume a session nonce: return the stored payload and DELETE the key so the
 * nonce is single-use. Returns null if the nonce is missing/expired/invalid —
 * `authorize()` treats null as a failed sign-in.
 *
 * Atomic single-use is enforced with GETDEL (Redis GET + DEL in one atomic
 * command). Two concurrent `signIn()` calls presenting the SAME nonce will race
 * on a plain GET-then-DEL: both GETs can succeed before either DEL runs, minting
 * two sessions from one credential. GETDEL makes the read-and-delete a single
 * server-side operation, so exactly one caller observes the payload and the
 * other gets null (→ failed sign-in). Redis failure fails closed (returns null)
 * — we never fall back to trusting a non-consumed nonce.
 */
export async function consumeSessionNonce(
  nonce: string
): Promise<NoncePayload | null> {
  if (!nonce) return null;
  try {
    const redis = client();
    const payload = await redis.getdel<NoncePayload>(NONCE_PREFIX + nonce);
    if (!payload || typeof payload !== 'object') return null;
    if (
      typeof payload.id !== 'string' ||
      typeof payload.accessToken !== 'string' ||
      typeof payload.refreshToken !== 'string'
    ) {
      return null;
    }
    return payload;
  } catch (err) {
    console.error('[sessionNonce] consume failed (denying):', err);
    return null;
  }
}

// Exposed for testing.
export function __setRedisForTest(fake: RedisLike | null): void {
  redisOverride = fake;
}
export const __test = { NONCE_PREFIX, NONCE_TTL_MS };
