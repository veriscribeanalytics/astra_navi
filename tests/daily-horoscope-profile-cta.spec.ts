import { test, expect } from '@playwright/test';
import { mockSession, mockProfileApi, mockHoroscopeApi, mockAllApis } from './auth-helpers';

test.describe('Daily Horoscope — Profile Location Required CTA', () => {
  test('shows CTA when profile_location_required=true', async ({ page, context }) => {
    await mockAllApis(page);
    await mockSession(page, context, { id: 'nl', email: 'nl@t.com', name: 'NoLoc' });
    await mockProfileApi(page, { id: 'nl', email: 'nl@t.com', name: 'NoLoc', dob: '1990-01-15', tob: '06:30', pob: 'Mumbai', moonSign: 'Aries', birthLatitude: 19.076, birthLongitude: 72.8777, birthTimezoneName: 'Asia/Kolkata', birthTimezoneOffsetAtBirth: 5.5 }, true);
    await mockHoroscopeApi(page, { calculation_unavailable: true, profile_location_required: true, message: 'Please confirm your exact birth location and timezone in your profile.' });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/exact birth location required/i).first()).toBeVisible({ timeout: 12000 });
  });

  test('shows forecast when location is present', async ({ page, context }) => {
    await mockAllApis(page);
    await mockSession(page, context, { id: 'hl', email: 'hl@t.com', name: 'HasLoc' });
    await mockProfileApi(page, { id: 'hl', email: 'hl@t.com', name: 'HasLoc', dob: '1990-01-15', tob: '06:30', pob: 'Mumbai', birthLatitude: 19.076, birthLongitude: 72.8777, birthTimezoneName: 'Asia/Kolkata', birthTimezoneOffsetAtBirth: 5.5, moonSign: 'Aries' }, true);
    await mockHoroscopeApi(page, { sign: 'Aries', date: '2026-05-13', planetary: { active_dasha: 'Venus-Sun-Moon' }, areas: { career: { score: 70, text: 'Good' }, relationships: { score: 65, text: 'Harmony' }, health: { score: 60, text: 'Active' }, finances: { score: 75, text: 'Favorable' }, spirituality: { score: 80, text: 'Peace' } }, system: { is_personalized: true }, _cache_version: 2 });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(/exact birth location required/i)).toHaveCount(0, { timeout: 12000 });
  });
});