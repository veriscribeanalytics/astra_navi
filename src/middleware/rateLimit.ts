// Rate limiting middleware for API routes
// This prevents abuse and brute force attacks

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
}

export function rateLimit(config: RateLimitConfig) {
  return (identifier: string): { allowed: boolean; remaining: number; resetTime: number } => {
    const now = Date.now();
    const key = identifier;

    if (!store[key] || store[key].resetTime < now) {
      // Create new window
      store[key] = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      return {
        allowed: true,
        remaining: config.max - 1,
        resetTime: store[key].resetTime,
      };
    }

    // Increment count
    store[key].count++;

    if (store[key].count > config.max) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: store[key].resetTime,
      };
    }

    return {
      allowed: true,
      remaining: config.max - store[key].count,
      resetTime: store[key].resetTime,
    };
  };
}

// Pre-configured rate limiters
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
});
