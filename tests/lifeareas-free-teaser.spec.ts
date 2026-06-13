import { expect, test } from '@playwright/test';
import { mockAllApis, mockPaywallApi, mockSession } from './auth-helpers';

const AREA_SCORES = {
  career: 98,
  love: 63,
  health: 97,
  finance: 79,
  spiritual: 78,
  general: 89,
} as const;

test('free users can see life-area scores while insights and forecasts stay paywalled', async ({ page, context }) => {
  await mockSession(page, context, {
    id: 'free-user',
    email: 'free@example.com',
    name: 'Ankit Prasad',
  });
  await mockAllApis(page);
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
        user: { sign: 'Gemini', name: 'Ankit Prasad' },
        score: {
          overall: 89,
          areas: Object.fromEntries(
            Object.entries(AREA_SCORES).map(([area, value]) => [area, { value }])
          ),
        },
        areas_text: {
          career: { insight: 'Premium career insight.', tone: 'positive' },
          love: { insight: 'Premium love insight.', tone: 'neutral' },
          health: { insight: 'Premium health insight.', tone: 'neutral' },
          finance: { insight: 'Premium finance insight.', tone: 'positive' },
          spiritual: { insight: 'Premium spiritual insight.', tone: 'neutral' },
        },
        paywall: {
          featureKey: 'full_daily_horoscope',
          title: 'Full Daily Horoscope',
          isSoft: true,
          suggestedProducts: [],
        },
      }),
    })
  );

  await page.goto('/lifeareas');

  for (const [area, score] of Object.entries(AREA_SCORES)) {
    await expect(page.getByTestId(`life-area-score-${area}`)).toHaveText(String(score));
    await expect(page.getByTestId(`life-area-teaser-${area}`)).toHaveAttribute(
      'aria-label',
      new RegExp(`${score} out of 100$`)
    );
  }

  await expect(page.getByText('Premium career insight.')).toHaveCount(0);
  await expect(page.getByText('7-Day Outlook Trend')).toBeVisible();
  await expect(page.locator('a[href^="/plans?feature=full_daily_horoscope"]')).toHaveCount(2);
});
