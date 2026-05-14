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

/** All paywall feature keys — used to build mock responses. */
const ALL_FEATURE_KEYS = [
  'chat_message',
  'full_daily_horoscope',
  'tomorrow_horoscope',
  'guided_consult',
  'match_report',
  'kundli_premium',
];

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

/**
 * Mock paywall API routes with correct backend shape.
 *
 * The batch /features endpoint MUST return { features: [...] } (array),
 * not {} or a Record map. Without this mock, the catch-all mockAllApis
 * returns {} for paywall routes, causing the defensive warning:
 *   "[usePaywall] checkAllFeatures: features is not an array {}"
 *
 * Default: all features accessible (simulates Pro user).
 * Pass overrides to customize individual feature states.
 */
export interface MockPaywallOverrides {
  /** Feature keys to mark as accessible=false (blocked). */
  blockedFeatures?: string[];
  /** Paywall data to attach to blocked features. */
  paywallData?: Record<string, Record<string, unknown>>;
  /** User tier for the batch response. */
  tier?: string;
  /** Total credits for the batch response. */
  totalCredits?: number;
}

export async function mockPaywallApi(page: Page, overrides: MockPaywallOverrides = {}) {
  const blockedSet = new Set(overrides.blockedFeatures ?? []);
  const features = ALL_FEATURE_KEYS.map((key) => {
    const accessible = !blockedSet.has(key);
    const item: Record<string, unknown> = { accessible, feature_key: key };
    if (accessible) {
      item.current_tier = overrides.tier ?? 'pro';
      item.available_credits = overrides.totalCredits ?? 300;
    } else {
      item.reason = 'insufficient_tier';
      item.min_tier = 'pro';
      if (overrides.paywallData?.[key]) {
        item.paywall = overrides.paywallData[key];
      } else {
        item.paywall = {
          featureKey: key,
          title: `Premium ${key}`,
          isSoft: key !== 'chat_message',
          suggestedProducts: [
            {
              productId: 'pro_monthly',
              productType: 'subscription',
              nameEn: 'Pro Monthly',
              nameHi: 'प्रो मासिक',
              credits: 300,
              tier: 'pro',
              priceInr: 199.00,
              priceUsd: 2.49,
              currency: 'INR',
              icon: 'pro',
              color: '#7C3AED',
            },
          ],
        };
      }
    }
    return item;
  });

  const batchResponse = {
    features,
    tier: overrides.tier ?? 'pro',
    totalCredits: overrides.totalCredits ?? 300,
  };

  // Batch features endpoint — returns { features: [...] } array
  await page.route('**/api/entitlements/paywall/features', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(batchResponse) });
  });

  // Single-feature check endpoint — returns PaywallCheck shape
  await page.route('**/api/entitlements/paywall**', async (route) => {
    const url = route.request().url();
    const featureMatch = url.match(/feature=([^&]+)/);
    const featureKey = featureMatch ? featureMatch[1] : 'chat_message';
    const isBlocked = blockedSet.has(featureKey);

    if (isBlocked) {
      await route.fulfill({
        status: 402,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'paywall_blocked',
          featureKey,
          reason: 'insufficient_tier',
          requiredCredits: 1,
          availableCredits: 0,
          minTier: 'pro',
          isSoft: featureKey !== 'chat_message',
          message: `Upgrade to access ${featureKey}.`,
          paywall: overrides.paywallData?.[featureKey] ?? {
            featureKey,
            title: `Premium ${featureKey}`,
            isSoft: featureKey !== 'chat_message',
            suggestedProducts: [
              {
                productId: 'pro_monthly',
                productType: 'subscription',
                nameEn: 'Pro Monthly',
                credits: 300,
                tier: 'pro',
                priceInr: 199.00,
                priceUsd: 2.49,
                currency: 'INR',
                icon: 'pro',
                color: '#7C3AED',
              },
            ],
          },
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessible: true, feature_key: featureKey, current_tier: overrides.tier ?? 'pro' }),
      });
    }
  });
}

/** Catch-all: return 200 for any /api/* not explicitly mocked, preventing 401s. */
export async function mockAllApis(page: Page) {
  // Default paywall batch response — all features accessible (Pro user).
  // This is critical: the catch-all must return { features: [...] } for paywall URLs
  // because usePaywall.normalization requires an array, and {} triggers the warning:
  //   "[usePaywall] checkAllFeatures: features is not an array {}"
  const PAYWALL_BATCH_DEFAULT = {
    features: ALL_FEATURE_KEYS.map((key) => ({
      accessible: true,
      feature_key: key,
      current_tier: 'pro',
      available_credits: 300,
    })),
    tier: 'pro',
    totalCredits: 300,
  };

  await page.route('**/api/**', async (route) => {
    const url = route.request().url();

    // Paywall batch endpoint — must return { features: [...] } array
    if (url.includes('/api/entitlements/paywall/features')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(PAYWALL_BATCH_DEFAULT),
      });
      return;
    }

    // Paywall single-feature check — return accessible: true (Pro user default)
    if (url.includes('/api/entitlements/paywall')) {
      const featureMatch = url.match(/feature=([^&]+)/);
      const featureKey = featureMatch ? featureMatch[1] : 'chat_message';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessible: true, feature_key: featureKey, current_tier: 'pro' }),
      });
      return;
    }

    // All other /api/* — return empty object
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}
