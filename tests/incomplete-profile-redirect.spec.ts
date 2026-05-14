import { test, expect } from '@playwright/test';
import { mockSession, mockProfileApi, mockHoroscopeApi, mockAllApis } from './auth-helpers';

test.describe('Incomplete Profile Redirect', () => {
  test('redirects when profileComplete=false', async ({ page, context }) => {
    // Catch-all FIRST so explicit mocks override it
    await mockAllApis(page);
    await mockSession(page, context, { id: 'u1', email: 'inc@t.com', name: 'Inc' });
    await mockProfileApi(page, { id: 'u1', email: 'inc@t.com', name: 'Inc', dob: '1990-01-15', tob: '06:30', pob: 'Mumbai', birthLatitude: null, birthLongitude: null, birthTimezoneName: null, birthTimezoneOffsetAtBirth: null }, false);
    await mockHoroscopeApi(page, { calculation_unavailable: true, profile_location_required: true, message: '' });

    await page.goto('/');
    await page.waitForURL('**/profile?onboarding=true*', { timeout: 8000 });
    expect(page.url()).toContain('onboarding=true');
  });

  test('stays on dashboard when profileComplete=true', async ({ page, context }) => {
    await mockAllApis(page);
    await mockSession(page, context, { id: 'u2', email: 'ok@t.com', name: 'OK' });
    await mockProfileApi(page, { id: 'u2', email: 'ok@t.com', name: 'OK', dob: '1990-01-15', tob: '06:30', pob: 'Mumbai', birthLatitude: 19.076, birthLongitude: 72.8777, birthTimezoneName: 'Asia/Kolkata', birthTimezoneOffsetAtBirth: 5.5, moonSign: 'Aries' }, true);
    await mockHoroscopeApi(page, { sign: 'Aries', date: '2026-05-13', planetary: { active_dasha: 'Venus-Sun-Moon' }, areas: { career: { score: 70, text: 'Good' }, relationships: { score: 65, text: 'Harmony' }, health: { score: 60, text: 'Active' }, finances: { score: 75, text: 'Favorable' }, spirituality: { score: 80, text: 'Peace' } }, system: { is_personalized: true }, _cache_version: 2 });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('login?error=SessionExpired');
  });

  test('stays on dashboard when fields are complete even if backend flag is stale false', async ({ page, context }) => {
    await mockAllApis(page);
    await mockSession(page, context, { id: 'u3', email: 'stale@t.com', name: 'Stale Flag' });
    await mockProfileApi(page, {
      id: 'u3',
      email: 'stale@t.com',
      name: 'Stale Flag',
      dob: '1990-01-15',
      tob: '06:30',
      pob: 'Mumbai',
      birthLatitude: 19.076,
      birthLongitude: 72.8777,
      birthTimezoneName: 'Asia/Kolkata',
      birthTimezoneOffsetAtBirth: 5.5,
      moonSign: 'Aries',
    }, false);
    await mockHoroscopeApi(page, { sign: 'Aries', date: '2026-05-13', areas: {} });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    expect(page.url()).not.toContain('/profile?onboarding=true');
  });
});
