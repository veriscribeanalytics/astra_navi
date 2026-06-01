import { test } from '@playwright/test';
import { mockSession, mockAllApis } from './auth-helpers';
const FULL_PROFILE = { id:'test-user',email:'ravinder@test.com',name:'Ravinder Kumar',dob:'1990-08-15',tob:'14:30',pob:'New Delhi, India',birthLatitude:28.6139,birthLongitude:77.209,birthTimezoneName:'Asia/Kolkata',moonSign:'Leo',sunSign:'Libra',lagnaSign:'Leo',astrologyData:{planets:[{planet:'Sun',sign:'Leo'}]} };

test('free user with credits', async ({ page, context }) => {
  await mockSession(page, context, { id:'test-user',email:'ravinder@test.com',name:'Ravinder Kumar' });
  await mockAllApis(page);
  await page.route('**/api/user/profile*', r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({user:FULL_PROFILE,profileComplete:true})}));
  await page.route('**/api/billing/paywall*', r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({tier:'free',totalCredits:30})}));
  await page.setViewportSize({ width:1440, height:1100 });
  await page.goto('/', { waitUntil:'networkidle' });
  await page.waitForTimeout(3000);
  await page.locator('text=Meet Your AI Astrologers').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.screenshot({ path:'scratch/shots/premium-unlocked.png' });
});

test('free user with zero credits', async ({ page, context }) => {
  await mockSession(page, context, { id:'test-user',email:'ravinder@test.com',name:'Ravinder Kumar' });
  await mockAllApis(page);
  await page.route('**/api/user/profile*', r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({user:FULL_PROFILE,profileComplete:true})}));
  await page.route('**/api/billing/paywall*', r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({tier:'free',totalCredits:0})}));
  await page.setViewportSize({ width:1440, height:1100 });
  await page.goto('/', { waitUntil:'networkidle' });
  await page.waitForTimeout(3000);
  await page.locator('text=Meet Your AI Astrologers').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.screenshot({ path:'scratch/shots/premium-locked.png' });
  await page.locator('text=Cosmic Portals').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.screenshot({ path:'scratch/shots/premium-portals.png' });
});
