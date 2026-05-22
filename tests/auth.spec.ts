// auth.spec.ts — Playwright tests for auth pages and logout behavior
// Related to the auth UI refactor plan

import { test, expect } from '@playwright/test';
import { mockSession, mockAllApis } from './auth-helpers';

test.describe('Login Page', () => {
  test('renders login form with email, password, and sign in button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('label:has-text("Email")').first()).toBeVisible();
    await expect(page.locator('label:has-text("Password")').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });

  test('shows "Forgot Password?" link', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Forgot Password?')).toBeVisible();
  });

  test('toggle between sign-in and register via button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/login');
    // Verify toggle button exists with "Don't have" text
    const toggleBtn = page.locator('button').filter({ hasText: /Don'?t have/ }).first();
    await expect(toggleBtn).toBeVisible();
    // Scroll into view to ensure the click lands on the element (not clipped by overflow)
    await toggleBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await toggleBtn.click();
    await page.waitForTimeout(400);
    // After toggle, the form should change — the "Forgot Password?" link (only in SignInForm) should be gone
    await expect(page.getByText('Forgot Password?')).not.toBeVisible({ timeout: 5000 });
  });

  test('mobile layout does not overflow horizontally', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    const body = page.locator('body');
    const scrollWidth = await body.evaluate((el) => el.scrollWidth);
    const clientWidth = await body.evaluate((el) => el.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
    await expect(page.locator('label:has-text("Email")').first()).toBeVisible();
  });

  test('session-expired recovery clears once and stays on stable login page', async ({ page }) => {
    let clearSessionCalls = 0;
    await page.route('**/api/auth/clear-session', async (route) => {
      clearSessionCalls++;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' });
    });

    await page.goto('/login?error=SessionExpired&sessionCleared=1');
    await page.waitForURL('**/login?sessionCleared=1', { timeout: 5000 });
    await page.waitForTimeout(500);

    expect(clearSessionCalls).toBe(1);
    expect(page.url()).toContain('/login?sessionCleared=1');
    expect(page.url()).not.toContain('error=SessionExpired');
  });
});

test.describe('Session Recovery', () => {
  test('landing page does not redirect-loop when session cookie has refresh error', async ({ page, context }) => {
    await mockAllApis(page);
    await mockSession(page, context, {
      id: 'expired-user',
      email: 'expired@test.com',
      name: 'Expired User',
      error: 'TokenReuseError',
    });

    const urls: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) urls.push(frame.url());
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    expect(page.url()).not.toContain('/login?error=SessionExpired');
    expect(page.url()).not.toContain('/chat');
    expect(urls.filter((url) => url.includes('/login') || url.includes('/chat')).length).toBe(0);
  });

  test('authenticated chat load does not bounce to login while profile hydrates', async ({ page, context }) => {
    await mockAllApis(page);
    await mockSession(page, context, {
      id: 'hydrating-user',
      email: 'hydrating@test.com',
      name: 'Hydrating User',
    });
    await page.route('**/api/user/profile*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'hydrating-user',
            email: 'hydrating@test.com',
            name: 'Hydrating User',
          },
          profileComplete: true,
        }),
      });
    });

    const urls: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) urls.push(frame.url());
    });

    await page.goto('/chat', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);

    expect(page.url()).toContain('/chat');
    expect(urls.some((url) => url.includes('/login?callbackUrl=/chat'))).toBe(false);
  });
});

test.describe('Forgot Password Page', () => {
  test('renders email form and send reset link button', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('label:has-text("Email")').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Send Reset Link/i })).toBeVisible();
    await expect(page.getByText('Back to Login')).toBeVisible();
  });

  test('submit button is disabled when email is empty', async ({ page }) => {
    await page.goto('/forgot-password');
    const button = page.getByRole('button', { name: /Send Reset Link/i });
    await expect(button).toBeDisabled();
  });
});

test.describe('Reset Password Page', () => {
  test('shows missing-token state when no token provided', async ({ page }) => {
    await page.goto('/reset-password');
    const button = page.getByRole('button', { name: /Reset Password/i });
    await expect(button).toBeDisabled();
  });

  test('shows password fields when valid token provided', async ({ page }) => {
    await page.goto('/reset-password?token=test-token-123');
    await expect(page.locator('label:has-text("New Password")').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('label:has-text("Confirm Password")').first()).toBeVisible();
    const btn = page.getByRole('button', { name: /Reset Password/i });
    await expect(btn).toBeDisabled();
  });
});

test.describe('Logout Flow', () => {
  test('logout confirmation modal opens from navbar', async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await mockAllApis(page);
    await mockSession(page, context);
    await page.goto('/');

    // Desktop avatar button with profile-ring-glow class
    const avatarBtn = page.locator('nav .profile-ring-glow').first();
    await expect(avatarBtn).toBeVisible({ timeout: 5000 });
    await avatarBtn.click();
    await page.waitForTimeout(400);

    // The user dropdown should have "Sign Out" button
    const signOutBtn = page.getByRole('button', { name: /Sign Out/i });
    await expect(signOutBtn).toBeVisible({ timeout: 3000 });
    await signOutBtn.click();

    // ConfirmDialog opens
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });
    await expect(dialog.getByText(/Sign out of AstraNavi/i)).toBeVisible();

    // Dismiss with Cancel
    await dialog.getByRole('button', { name: /Cancel/i }).click();
    await expect(dialog).not.toBeVisible();
  });
});

test.describe('Logout Page', () => {
  test('/logout page renders confirmation screen with cancel and sign out buttons', async ({ page }) => {
    await page.goto('/logout');
    await expect(page.locator('h1:has-text("Sign Out")')).toBeVisible();
    await expect(page.getByText(/Are you sure/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign Out/i })).toBeVisible();
  });
});

test.describe('Mobile Auth Layout', () => {
  test('login page does not overflow on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/login');
    const body = page.locator('body');
    const overflowX = await body.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflowX).toBeLessThanOrEqual(5);
  });

  test('register toggle visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    const toggleBtn = page.locator('button').filter({ hasText: /Don'?t have/ }).first();
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await toggleBtn.click();
    await page.waitForTimeout(400);
    // "Forgot Password?" should disappear after toggle (only present in sign-in)
    await expect(page.getByText('Forgot Password?')).not.toBeVisible({ timeout: 5000 });
  });

  test('forgot password page is centered on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await page.goto('/forgot-password');
    await expect(page.locator('label:has-text("Email")').first()).toBeVisible();
    await expect(page.getByText('Back to Login')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('password toggle has accessible label and aria-pressed on login form', async ({ page }) => {
    await page.goto('/login');
    const toggleBtn = page.locator('button[aria-label="Show password"]').first();
    await expect(toggleBtn).toBeVisible();
    expect(await toggleBtn.getAttribute('aria-pressed')).toBe('false');
    // The existence of aria-label alone confirms the accessible pattern
  });

  test('form inputs have associated labels', async ({ page }) => {
    await page.goto('/login');
    const emailLabel = page.locator('label').filter({ hasText: /Email/i }).first();
    await expect(emailLabel).toBeVisible();
    const passwordLabel = page.locator('label').filter({ hasText: /Password/i }).first();
    await expect(passwordLabel).toBeVisible();
  });
});

test.describe('Backend Auth Error Handling & Localization', () => {
  test('shows inline field error for wrong password', async ({ page }) => {
    await page.route('**/api/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'wrong_password',
          message: 'Incorrect password. Please try again.',
          field: 'password'
        })
      });
    });

    await page.goto('/login');
    await page.waitForTimeout(500);
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    const emailCount = await page.locator('input[type="email"]').count();
    const passwordCount = await page.locator('input[type="password"]').count();
    console.log(`TEST RUN LOG: Email count=${emailCount}, Password count=${passwordCount}`);
    await page.locator('input[type="email"]').first().fill('test@test.com');
    await page.locator('input[type="password"]').first().fill('wrong-pass');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Verify field-level error message is shown inline under the password input
    const inlineError = page.locator('p.text-red-500');
    await expect(inlineError).toBeVisible({ timeout: 5000 });
    await expect(inlineError).toContainText(/Incorrect password|wrong/i);
  });

  test('shows lockout banner with timer and redirect for account_locked', async ({ page }) => {
    await page.route('**/api/login', async (route) => {
      await route.fulfill({
        status: 423,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'account_locked',
          message: 'Your account has been locked due to too many failed attempts.',
          retryAfterSeconds: 90,
          action: 'reset_password'
        })
      });
    });

    await page.goto('/login');
    await page.waitForTimeout(500);
    await page.locator('input[type="email"]').first().fill('test@test.com');
    await page.locator('input[type="password"]').first().fill('wrong-pass');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Verify error banner is shown with locked message and countdown
    const banner = page.locator('[role="alert"]').first();
    await expect(banner).toBeVisible({ timeout: 5000 });
    await expect(banner).toContainText(/locked/i);
    // Verify lockout countdown is visible
    await expect(banner).toContainText(/1m\s*30s|1m|try again/i);

    // Verify CTA button within the banner is visible and clickable
    const ctaBtn = banner.getByRole('button', { name: /Reset Password|Forgot/i }).first();
    await expect(ctaBtn).toBeVisible();
    await ctaBtn.click();

    // Verify it navigated to /forgot-password
    await page.waitForURL('**/forgot-password', { timeout: 5000 });
    expect(page.url()).toContain('/forgot-password');
  });

  test('shows create account CTA for email_not_registered and switches form on click', async ({ page }) => {
    await page.route('**/api/login', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'email_not_registered',
          message: 'This email address is not registered.',
          action: 'register'
        })
      });
    });

    await page.goto('/login');
    await page.waitForTimeout(500);
    await page.locator('input[type="email"]').first().fill('unregistered@test.com');
    await page.locator('input[type="password"]').first().fill('some-pass123');
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Verify error banner is shown
    const banner = page.locator('[role="alert"]').first();
    await expect(banner).toBeVisible({ timeout: 5000 });
    await expect(banner).toContainText(/not registered/i);

    // Verify CTA button is visible and switches to registration form
    const ctaBtn = banner.getByRole('button', { name: /Create Account|Register/i }).first();
    await expect(ctaBtn).toBeVisible();
    await ctaBtn.click();

    // Once clicked, "Forgot Password?" should disappear because we switched to the Register form
    await expect(page.getByText('Forgot Password?')).not.toBeVisible({ timeout: 5000 });
  });
});
