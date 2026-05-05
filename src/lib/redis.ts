import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (!_redis) {
    try {
      _redis = Redis.fromEnv();
    } catch {
      throw new Error('Redis environment variables (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN) are not configured.');
    }
  }
  return _redis;
}

export const redis: Redis = new Proxy({} as Redis, {
  get(_, prop) {
    return (getRedis() as unknown as Record<string, unknown>)[prop as string];
  },
});
