import { test, expect } from '@playwright/test';
import {
  createSessionNonce,
  consumeSessionNonce,
  __setRedisForTest,
  __test,
  type NoncePayload,
} from '../src/lib/sessionNonce';

/**
 * In-memory stand-in for the Upstash client with just enough semantics for the
 * nonce tests: SET w/ PX (expiry), and a genuinely ATOMIC GETDEL (the value is
 * read and removed in one synchronous step, so a second concurrent consumer of
 * the same key observes null — the property the real Redis GETDEL gives us and
 * that plain GET-then-DEL does NOT).
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
    // Atomic read-and-delete: remove the entry while returning its value, so a
    // racing second consumer sees nothing. This mirrors Redis GETDEL, which is
    // the whole point of the consume() implementation.
    async getdel<T>(key: string): Promise<T | null> {
      const e = live(key);
      if (!e) return null;
      store.delete(key);
      return e.value as T;
    },
    async set(key: string, value: unknown, opts?: { px?: number; nx?: boolean }) {
      if (opts?.nx && live(key)) return null;
      store.set(key, { value, expiresAt: Date.now() + (opts?.px ?? 60_000) });
      return 'OK';
    },
    async del(key: string) {
      return store.delete(key) ? 1 : 0;
    },
  };
}

const PAYLOAD: NoncePayload = {
  id: 'user-123',
  email: 'who@example.com',
  name: 'Test User',
  accessToken: 'access-token-secret',
  refreshToken: 'refresh-token-secret',
  expiresIn: 3600,
};

test.afterEach(() => {
  __setRedisForTest(null);
});

test.describe('sessionNonce — single-use atomicity', () => {
  test('a nonce can be consumed exactly once (second consume is null)', async () => {
    __setRedisForTest(makeFakeRedis());
    const nonce = await createSessionNonce(PAYLOAD);
    expect(nonce).toBeTruthy();

    const first = await consumeSessionNonce(nonce);
    expect(first?.id).toBe(PAYLOAD.id);
    expect(first?.accessToken).toBe(PAYLOAD.accessToken);

    // Replay must fail — single-use.
    const replay = await consumeSessionNonce(nonce);
    expect(replay).toBeNull();
  });

  test('two CONCURRENT consumes of the same nonce yield exactly one payload', async () => {
    // This is the race that plain GET-then-DEL loses: both callers' GETs can
    // succeed before either DEL runs, minting two sessions from one nonce.
    // Atomic GETDEL must guarantee exactly one winner.
    __setRedisForTest(makeFakeRedis());
    const nonce = await createSessionNonce(PAYLOAD);

    const [a, b] = await Promise.all([
      consumeSessionNonce(nonce),
      consumeSessionNonce(nonce),
    ]);

    const winners = [a, b].filter(Boolean);
    expect(winners).toHaveLength(1);
    expect(winners[0]?.id).toBe(PAYLOAD.id);
  });

  test('a forged / unknown nonce is rejected (null)', async () => {
    __setRedisForTest(makeFakeRedis());
    expect(await consumeSessionNonce('not-a-real-nonce')).toBeNull();
    expect(await consumeSessionNonce('')).toBeNull();
  });

  test('a payload missing token fields is rejected even if the key exists', async () => {
    __setRedisForTest(makeFakeRedis());
    // Plant a malformed payload directly under the prefix a real nonce would use.
    const fake = makeFakeRedis();
    await fake.set(`${__test.NONCE_PREFIX}malformed`, {
      id: 'x',
      // accessToken / refreshToken intentionally absent
    });
    __setRedisForTest(fake);
    expect(await consumeSessionNonce('malformed')).toBeNull();
  });

  test('Redis failure fails closed — never returns a payload', async () => {
    __setRedisForTest({
      async get() { throw new Error('redis down'); },
      async getdel() { throw new Error('redis down'); },
      async set() { throw new Error('redis down'); },
      async del() { throw new Error('redis down'); },
    });
    // Consume on a downed Redis must deny, not hand back a stale/unchecked value.
    expect(await consumeSessionNonce('anything')).toBeNull();
  });
});
