import { expect, test } from '@playwright/test';
import {
  mockAllApis,
  mockPaywallApi,
  mockProfileApi,
  mockSession,
} from './auth-helpers';

const AREA_SCORES = {
  career: 98,
  love: 63,
  health: 97,
  finance: 79,
  spiritual: 78,
  general: 89,
} as const;

test('free dashboard derives best, stable, and worst life areas from daily scores', async ({
  page,
  context,
}) => {
  const user = {
    id: 'free-user',
    email: 'free@example.com',
    name: 'Ankit Prasad',
  };

  await mockSession(page, context, user);
  await mockAllApis(page);
  await mockProfileApi(
    page,
    {
      ...user,
      dob: '1994-06-13',
      tob: '12:00',
      pob: 'Nashik, India',
      birthLatitude: 19.9975,
      birthLongitude: 73.7898,
      birthTimezoneName: 'Asia/Kolkata',
      moonSign: 'Gemini',
      sunSign: 'Gemini',
      lagnaSign: 'Gemini',
      astrologyData: {},
    },
    true
  );
  await mockPaywallApi(page, {
    tier: 'free',
    totalCredits: 0,
    blockedFeatures: ['full_daily_horoscope'],
  });

  await page.route('**/api/daily-horoscope*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { sign: 'Gemini', name: user.name },
        score: {
          overall: 89,
          areas: Object.fromEntries(
            Object.entries(AREA_SCORES).map(([area, value]) => [area, { value }])
          ),
        },
        areas_text: {},
      }),
    })
  );

  await page.goto('/');

  const best = page.getByTestId('dashboard-life-area-career');
  const stable = page.getByTestId('dashboard-life-area-general');
  const worst = page.getByTestId('dashboard-life-area-love');

  await expect(best).toContainText('98');
  await expect(best).toContainText('BEST TODAY');
  await expect(stable).toContainText('89');
  await expect(stable).toContainText('STABLE THIS WEEK');
  await expect(worst).toContainText('63');
  await expect(worst).toContainText('NEEDS ATTENTION');
  await expect(page.locator('[data-testid^="dashboard-life-area-"]')).toHaveCount(3);
});
