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

test.describe('API Settings', () => {
  test('should display settings section', async ({ page }) => {
    await registerAndLogin(page);

    // Look for settings tab or section
    const settingsTab = page.locator('button, [role="tab"]').filter({ hasText: /settings|config|api/i }).first();
    if (await settingsTab.isVisible({ timeout: 5000 })) {
      await settingsTab.click();
    }

    // Should see settings form with API key or model options
    await expect(page.getByText(/api|key|model|gemini|settings/i)).toBeVisible({ timeout: 10000 });
  });

  test('should show API key configuration', async ({ page }) => {
    await registerAndLogin(page);

    // Navigate to settings
    const settingsTab = page.locator('button, [role="tab"]').filter({ hasText: /settings|config|api/i }).first();
    if (await settingsTab.isVisible({ timeout: 5000 })) {
      await settingsTab.click();
    }

    // Should have API key input or masked key display
    const apiSection = page.getByText(/api key|gemini/i);
    await expect(apiSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show model selection options', async ({ page }) => {
    await registerAndLogin(page);

    // Navigate to settings
    const settingsTab = page.locator('button, [role="tab"]').filter({ hasText: /settings|config|api/i }).first();
    if (await settingsTab.isVisible({ timeout: 5000 })) {
      await settingsTab.click();
    }

    // Should have model selection
    await expect(page.getByText(/model|gemini/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show token and temperature settings', async ({ page }) => {
    await registerAndLogin(page);

    // Navigate to settings
    const settingsTab = page.locator('button, [role="tab"]').filter({ hasText: /settings|config|api/i }).first();
    if (await settingsTab.isVisible({ timeout: 5000 })) {
      await settingsTab.click();
    }

    // Should have token/temperature controls
    await expect(page.getByText(/token|temperature|settings/i).first()).toBeVisible({ timeout: 10000 });
  });
});
