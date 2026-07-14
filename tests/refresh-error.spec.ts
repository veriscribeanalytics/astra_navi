import { test, expect } from '@playwright/test';
import { isRefreshFailureFatal } from '../src/lib/refreshError';

/**
 * Pins the security-relevant guarantee that a transient refresh failure — most
 * importantly a backend 429 (Too Many Requests) — is NOT classified as fatal.
 *
 * Why this matters: a refresh that gets rate-limited by the backend is a
 * temporary throttle, not a revoked token. Classifying it as fatal persisted
 * TokenReuseError into the JWT, which the middleware read as a session error
 * and used to redirect a still-valid user to /login. The fix: 429 is transient
 * (keep the user logged in, retry next request); only true reuse/expiry/401 is
 * fatal (sign out).
 *
 * This is a pure-logic unit test (no server round-trip) because the
 * classification lives in an exported pure helper (isRefreshFailureFatal). The
 * E2E refresh-race.spec.ts covers the success/single-flight path.
 */

test.describe('isRefreshFailureFatal — 429 must NOT sign out a valid user', () => {
  test('HTTP 429 (rate limited) is TRANSIENT — not fatal', () => {
    expect(isRefreshFailureFatal({ status: 429 })).toBe(false);
    expect(isRefreshFailureFatal({ status: 429, error: 'Too Many Requests' })).toBe(false);
    // Backend-shaped rate-limit body (code field) must also be transient.
    expect(isRefreshFailureFatal({ code: 'rate_limited', status: 429 })).toBe(false);
  });

  test('HTTP 5xx is TRANSIENT — not fatal', () => {
    expect(isRefreshFailureFatal({ status: 500 })).toBe(false);
    expect(isRefreshFailureFatal({ status: 502 })).toBe(false);
    expect(isRefreshFailureFatal({ status: 503 })).toBe(false);
    expect(isRefreshFailureFatal({ status: 504 })).toBe(false);
  });

  test('network error (no status) is TRANSIENT — not fatal', () => {
    expect(isRefreshFailureFatal(new Error('fetch failed'))).toBe(false);
    expect(isRefreshFailureFatal({ message: 'ETIMEDOUT' })).toBe(false);
    expect(isRefreshFailureFatal(null)).toBe(false);
    expect(isRefreshFailureFatal(undefined)).toBe(false);
  });

  test('token reuse detected is FATAL', () => {
    expect(isRefreshFailureFatal({ status: 401, code: 'token_reuse_detected' })).toBe(true);
    expect(isRefreshFailureFatal({ code: 'token_reuse_detected' })).toBe(true);
    expect(isRefreshFailureFatal({ error: 'Token reuse detected' })).toBe(true);
    expect(isRefreshFailureFatal({ detail: 'Token reuse detected' })).toBe(true);
    expect(isRefreshFailureFatal({ message: 'Token reuse detected' })).toBe(true);
  });

  test('token expired / invalid is FATAL', () => {
    expect(isRefreshFailureFatal({ code: 'token_expired' })).toBe(true);
    expect(isRefreshFailureFatal({ code: 'token_invalid' })).toBe(true);
  });

  test('bare HTTP 401 is FATAL', () => {
    expect(isRefreshFailureFatal({ status: 401 })).toBe(true);
  });

  test('429 with a concurrent reuse code is still FATAL (reuse wins)', () => {
    // If the body somehow carries both a 429 status and a reuse code, the reuse
    // signal must dominate — never keep a reused token alive.
    expect(isRefreshFailureFatal({ status: 429, code: 'token_reuse_detected' })).toBe(true);
  });
});
