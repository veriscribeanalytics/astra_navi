import { test, expect } from '@playwright/test';
import {
  getCachedRotation,
  setCachedRotation,
  acquireRefreshLock,
  releaseRefreshLock,
  waitForRotation,
  __setRedisForTest,
  type RotatedTokens,
} from '../src/lib/refreshCache';

/**
 * In-memory stand-in for the Upstash client with just enough semantics:
 * NX (set-if-absent) and PX (expiry). Backs the cross-instance behaviour tests
 * below without a real Redis.
 */
function makeFakeRedis() {
  const store = new Map<string, { value: unknown; expiresAt: number }>();
  const live = (k: string) => {
    const e = store.get(k);
    if (!e) return null;
    if (e.expiresAt <= Date.now()) { store.delete(k); return null; }
    return e;
  };
  return {
    store,
    async get<T>(key: string): Promise<T | null> {
      const e = live(key);
      return e ? (e.value as T) : null;
    },
    async set(key: string, value: unknown, opts?: { px?: number; nx?: boolean }) {
      if (opts?.nx && live(key)) return null; // key exists → NX fails
      store.set(key, { value, expiresAt: Date.now() + (opts?.px ?? 60_000) });
      return 'OK';
    },
    async del(key: string) {
      return store.delete(key) ? 1 : 0;
    },
  };
}

const OLD = 'refresh-token-T1';
const ROTATED: RotatedTokens = {
  accessToken: 'A2',
  refreshToken: 'refresh-token-T2',
  accessTokenExpires: 9_999_999_999_999,
};

test.afterEach(() => {
  __setRedisForTest(null);
});

test.describe('refreshCache — cross-instance rotation guard', () => {
  test('only one of two concurrent callers wins the lock', async () => {
    __setRedisForTest(makeFakeRedis());
    const [a, b] = await Promise.all([
      acquireRefreshLock(OLD),
      acquireRefreshLock(OLD),
    ]);
    expect([a, b].filter(Boolean)).toHaveLength(1);
  });

  test('lock-loser reuses the winner\'s published pair instead of re-refreshing', async () => {
    __setRedisForTest(makeFakeRedis());

    // Winner takes the lock; loser is locked out.
    expect(await acquireRefreshLock(OLD)).toBe(true);
    expect(await acquireRefreshLock(OLD)).toBe(false);

    // Loser starts waiting; winner publishes shortly after.
    const loser = waitForRotation(OLD);
    await setCachedRotation(OLD, ROTATED);

    const got = await loser;
    expect(got?.refreshToken).toBe(ROTATED.refreshToken);
  });

  test('a straggler holding the old token reads the cached rotation (short-circuit)', async () => {
    __setRedisForTest(makeFakeRedis());
    await setCachedRotation(OLD, ROTATED);
    const got = await getCachedRotation(OLD);
    expect(got?.accessToken).toBe(ROTATED.accessToken);
  });

  test('releasing the lock lets the next caller acquire it', async () => {
    __setRedisForTest(makeFakeRedis());
    expect(await acquireRefreshLock(OLD)).toBe(true);
    await releaseRefreshLock(OLD);
    expect(await acquireRefreshLock(OLD)).toBe(true);
  });

  test('degrades gracefully when Redis throws (never blocks a refresh)', async () => {
    __setRedisForTest({
      async get() { throw new Error('redis down'); },
      async set() { throw new Error('redis down'); },
      async del() { throw new Error('redis down'); },
    });
    // Miss on read, and lock "acquired" so the caller proceeds to its own refresh.
    expect(await getCachedRotation(OLD)).toBeNull();
    expect(await acquireRefreshLock(OLD)).toBe(true);
  });
});
