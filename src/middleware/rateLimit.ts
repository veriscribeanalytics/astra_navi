import { redis } from '@/lib/redis';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
}

/**
 * Redis-backed rate limiter for Next.js API routes.
 * Works perfectly in serverless/edge environments.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = `ratelimit:frontend:${identifier}`;
  const now = Date.now();
  
  try {
    const results = await redis.pipeline()
      .incr(key)
      .pttl(key)
      .exec();

    const count = results[0] as number;
    let pttl = results[1] as number;

    // If key is new, set expiry
    if (count === 1 || pttl < 0) {
      await redis.pexpire(key, config.windowMs);
      pttl = config.windowMs;
    }

    const allowed = count <= config.max;
    const remaining = Math.max(0, config.max - count);
    const resetTime = now + pttl;

    return { allowed, remaining, resetTime };
  } catch (error) {
    console.error('Rate limit error (allowing by default):', error);
    return { allowed: true, remaining: 999, resetTime: now + config.windowMs };
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
