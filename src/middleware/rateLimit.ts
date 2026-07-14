import { getRedis } from '@/lib/redis';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
}

export interface RateLimitOptions {
  /**
   * Behavior when the Redis backing store is unreachable. Defaults to `false`
   * (FAIL CLOSED — deny the request), which is the only safe default for
   * security-sensitive routes (login, register, OTP, password-reset): an
   * attacker can't brute-force their way past the limiter by simply
   * waiting for Redis to hiccup.
   *
   * Set `failOpen: true` ONLY for routes where a false deny is worse than a
   * false allow and the backend enforces its own limits (e.g. uploads/username,
   * which pass the 429 straight through to the client for a soft retry).
   */
  failOpen?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  /** True when the decision is a fail-closed denial caused by a Redis error. */
  deniedByStoreError?: boolean;
}

/**
 * Redis-backed rate limiter for Next.js API routes.
 * Works perfectly in serverless/edge environments.
 *
 * SECURITY: fails CLOSED on a Redis error by default — i.e. the request is
 * denied. This is the inverse of the old behavior (which allowed every request
 * when Redis was unavailable), and it matters: every auth route (login,
 * register, OTP, password-reset) throttles through here, so failing open let an
 * attacker bypass brute-force protection simply by triggering a Redis outage.
 * The nonce/session code already treats Redis as required and fails closed;
 * the rate limiter now matches that posture.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const key = `ratelimit:frontend:${identifier}`;
  const now = Date.now();
  const failOpen = options.failOpen === true;

  try {
    const results = await getRedis().pipeline()
      .incr(key)
      .pttl(key)
      .exec();

    const count = results[0] as number;
    let pttl = results[1] as number;

    // If key is new, set expiry
    if (count === 1 || pttl < 0) {
      await getRedis().pexpire(key, config.windowMs);
      pttl = config.windowMs;
    }

    const allowed = count <= config.max;
    const remaining = Math.max(0, config.max - count);
    const resetTime = now + pttl;

    return { allowed, remaining, resetTime };
  } catch (error) {
    // Fail CLOSED unless the caller explicitly opted into fail-open. A denial is
    // surfaced with a 429-equivalent shape so callers that map `!allowed` → 429
    // behave identically to a genuine rate-limit hit.
    console.error(`[rateLimit] store error for "${identifier}" (failOpen=${failOpen ? 'open' : 'closed'}):`, error);
    if (failOpen) {
      return { allowed: true, remaining: 999, resetTime: now + config.windowMs };
    }
    return {
      allowed: false,
      remaining: 0,
      resetTime: now + config.windowMs,
      deniedByStoreError: true,
    };
  }
}

// Helper constants for specific limiters
export const AUTH_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
};

export const API_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 60,
};
