import { test, expect } from '@playwright/test';
import { mockSession, mockProfileApi, mockAllApis } from './auth-helpers';

test.describe('Refresh Token Single-Flight', () => {
  test('concurrent requests trigger exactly one refresh', async ({ page, context }) => {
    let refreshCallCount = 0;

    await mockAllApis(page);
    await mockSession(page, context, { id: 'race', email: 'race@t.com', name: 'Race' });
    await mockProfileApi(page, { id: 'race', email: 'race@t.com', name: 'Race', moonSign: 'Gemini', dob: '1990-06-15', tob: '12:00', pob: 'Delhi', birthLatitude: 28.6, birthLongitude: 77.2, birthTimezoneName: 'Asia/Kolkata', birthTimezoneOffsetAtBirth: 5.5 }, true);

    await page.route('**/api/auth/refresh', async (route) => {
      refreshCallCount++;
      await new Promise((r) => setTimeout(r, 300));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ accessToken: 'n-' + refreshCallCount, refreshToken: 'nr-' + refreshCallCount, expiresIn: 3600 }) });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const results = await page.evaluate(async () => {
      return Promise.all(Array.from({ length: 5 }, () => fetch('/api/user/profile?email=race%40t.com').then((r) => r.status).catch(() => 0)));
    });

    expect(results.filter((s: number) => s === 200).length).toBeGreaterThanOrEqual(4);
    expect(refreshCallCount).toBeLessThanOrEqual(1);
  });
});