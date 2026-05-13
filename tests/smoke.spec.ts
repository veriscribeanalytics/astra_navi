import { test, expect } from '@playwright/test';

test.describe('AstraNavi Smoke Tests', () => {
  test('Homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/AstraNavi/);

    // Check navbar
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();

    // The hero section or landing page content should be visible
    const getStartedButton = page.getByRole('link', { name: /login/i }).first();
    await expect(getStartedButton).toBeVisible();
  });

  test('Navigation to about page works', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveTitle(/AstraNavi/);
  });
  
  test('Navigation to chat works', async ({ page }) => {
    await page.goto('/chat');
    // Basic check that it doesn't crash
    await expect(page.locator('body')).toBeVisible();
  });
});
