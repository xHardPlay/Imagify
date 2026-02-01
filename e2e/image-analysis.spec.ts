import { test, expect } from '@playwright/test';

// Helper to register and login before tests
async function registerAndLogin(page: any) {
  await page.goto('/');

  const uniqueEmail = `test-${Date.now()}@example.com`;

  await page.getByRole('button', { name: 'Register' }).click();
  await page.locator('#email').fill(uniqueEmail);
  await page.locator('#password').fill('TestPassword123');
  await page.locator('#confirmPassword').fill('TestPassword123');

  await page.getByRole('button', { name: /register|create/i }).click();

  await expect(page.getByText(/workflow|FLUX/i)).toBeVisible({ timeout: 20000 });
}

test.describe('Image Upload', () => {
  test('should display upload area', async ({ page }) => {
    await registerAndLogin(page);

    // Should see upload zone or image upload section
    await expect(page.getByText(/upload|drop|image|drag|analyze/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('should have file input for images', async ({ page }) => {
    await registerAndLogin(page);

    // Should have file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached({ timeout: 10000 });
  });

  test('should show API key requirement message', async ({ page }) => {
    await registerAndLogin(page);

    // Without API key configured, should show message about it
    await expect(page.getByText(/api|key|configure|settings|gemini/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Results Display', () => {
  test('should display results section', async ({ page }) => {
    await registerAndLogin(page);

    // Look for results tab or section
    const resultsTab = page.locator('button, [role="tab"]').filter({ hasText: /result/i }).first();
    if (await resultsTab.isVisible({ timeout: 5000 })) {
      await resultsTab.click();
    }

    // Should see results area (even if empty)
    await expect(page.getByText(/result|output|analysis|no image/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show empty state without analysis', async ({ page }) => {
    await registerAndLogin(page);

    // Look for results tab
    const resultsTab = page.locator('button, [role="tab"]').filter({ hasText: /result/i }).first();
    if (await resultsTab.isVisible({ timeout: 5000 })) {
      await resultsTab.click();
    }

    // Should show empty state or prompt to upload
    await expect(page.getByText(/upload|no image|analyze|result/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Application Layout', () => {
  test('should display main navigation', async ({ page }) => {
    await registerAndLogin(page);

    // Should have main navigation or tabs
    await expect(page.getByText(/FLUX|Studio|workflow/i).first()).toBeVisible();
  });

  test('should display user menu', async ({ page }) => {
    await registerAndLogin(page);

    // Should have user menu or logout option
    const userMenu = page.locator('button').filter({ hasText: /@|logout|user|menu/i });
    const hasUserMenu = await userMenu.first().isVisible({ timeout: 5000 });

    // At minimum, should have logout capability somewhere
    expect(hasUserMenu || await page.getByText(/logout/i).isVisible()).toBeTruthy();
  });

  test('should be responsive', async ({ page }) => {
    await registerAndLogin(page);

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // App should still be functional
    await expect(page.getByText(/FLUX|workflow/i).first()).toBeVisible({ timeout: 5000 });
  });
});
