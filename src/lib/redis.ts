import { Redis } from '@upstash/redis';

/**
 * Global Redis client instance for the frontend.
 * Automatically picks up UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env.
 */
export const redis = Redis.fromEnv();
