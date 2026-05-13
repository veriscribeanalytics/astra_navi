/**
 * Auth helpers for Playwright tests with NextAuth 5.
 *
 * NextAuth 5 CSRF: uses a double-submit cookie pattern.
 * Cookie name: next-auth.csrf-token (or authjs.csrf-token)
 * Cookie value: <csrfToken>|<SHA256(csrfToken + AUTH_SECRET)>
 */
import type { Page, BrowserContext } from '@playwright/test';
import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { encode } from 'next-auth/jwt';

const TEST_AUTH_SECRET = 'b6b3b5514f7b5f54320e6e76839352e0081d50c2688f7b7b1d9601d9f8c6ebf2';
let cachedAuthSecret: string | null = null;

function readEnvFileSecret(): string | null {
  const envPath = join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return null;

  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const match = line.match(/^\s*(AUTH_SECRET|NEXTAUTH_SECRET)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    const value = match[2].trim().replace(/^['"]|['"]$/g, '');
    if (value) return value;
  }
  return null;
}

function getAuthSecret(): string {
  if (!cachedAuthSecret) {
    cachedAuthSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || readEnvFileSecret() || TEST_AUTH_SECRET;
  }
  return cachedAuthSecret;
}

const CSRF_TOKEN = 'mock-csrf-token-for-testing-00000000000000000000000000';

function csrfCookieValue(): string {
  const hash = createHash('sha256').update(CSRF_TOKEN + getAuthSecret()).digest('hex');
  return `${CSRF_TOKEN}|${hash}`;
}

export interface TestUser { id: string; email: string; name: string; }

export async function mockSession(page: Page, context: BrowserContext, user: TestUser = { id: 'test-user', email: 'test@test.com', name: 'Test User' }) {
  const cookieVal = csrfCookieValue();
  const sessionToken = await encode({
    secret: getAuthSecret(),
    salt: 'authjs.session-token',
    token: {
      id: user.id,
      sub: user.id,
      email: user.email,
      name: user.name,
      accessToken: `test-access-token-${user.id}`,
      refreshToken: `test-refresh-token-${user.id}`,
      accessTokenExpires: Date.now() + 60 * 60 * 1000,
    },
    maxAge: 24 * 60 * 60,
  });

  await context.addCookies([
    { name: 'next-auth.csrf-token', value: cookieVal, domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' as const },
    { name: 'authjs.csrf-token', value: cookieVal, domain: 'localhost', path: '/', httpOnly: false, secure: false, sameSite: 'Lax' as const },
    { name: 'authjs.session-token', value: sessionToken, domain: 'localhost', path: '/', httpOnly: true, secure: false, sameSite: 'Lax' as const },
  ]);
  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          ...user,
          accessToken: `test-access-token-${user.id}`,
          refreshToken: `test-refresh-token-${user.id}`,
          accessTokenExpires: Date.now() + 60 * 60 * 1000,
        },
        expires: new Date(Date.now() + 86400000).toISOString()
      })
    });
  });
  await page.route('**/api/auth/csrf', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Set-Cookie': `next-auth.csrf-token=${cookieVal}; Path=/; HttpOnly; SameSite=Lax` }, body: JSON.stringify({ csrfToken: CSRF_TOKEN }) });
  });
}

export async function mockProfileApi(page: Page, profile: Record<string, unknown>, profileComplete: boolean) {
  await page.route('**/api/user/profile*', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: profile.id, email: profile.email, name: profile.name, ...profile }, profileComplete }) });
  });
}

export async function mockHoroscopeApi(page: Page, response: Record<string, unknown>) {
  for (const p of ['**/api/horoscope/*', '**/api/daily-horoscope*', '**/api/horoscope-general*']) {
    await page.route(p, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) });
    });
  }
}

export async function mockDashboardApis(page: Page) {
  const endpoints = [
    '**/api/analyze-full',
    '**/api/planets*',
    '**/api/forecast*',
    '**/api/status',
    '**/api/user/sync-astrology',
    '**/api/health',
  ];
  for (const ep of endpoints) {
    await page.route(ep, async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
  }
}

/** Catch-all: return 200 for any /api/* not explicitly mocked, preventing 401s. */
export async function mockAllApis(page: Page) {
  // Must be registered LAST so explicit mocks take priority
  await page.route('**/api/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}
