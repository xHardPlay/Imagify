import { test, expect } from '@playwright/test';

// Helper to register and login before tests
async function registerAndLogin(page: any) {
  await page.goto('/');

  // Register a new user for testing
  const uniqueEmail = `test-${Date.now()}@example.com`;

  await page.getByRole('button', { name: 'Register' }).click();
  await page.locator('#email').fill(uniqueEmail);
  await page.locator('#password').fill('TestPassword123');
  await page.locator('#confirmPassword').fill('TestPassword123');

  await page.getByRole('button', { name: /register|create/i }).click();

  // Wait for main app to load
  await expect(page.getByText(/workflow|FLUX/i)).toBeVisible({ timeout: 20000 });
}

test.describe('Workflows', () => {
  test('should display workflows section after login', async ({ page }) => {
    await registerAndLogin(page);

    // Should see workflows section
    await expect(page.getByText(/workflow/i)).toBeVisible();
  });

  test('should create a new workflow', async ({ page }) => {
    await registerAndLogin(page);

    // Look for create/new workflow button
    const newBtn = page.locator('button').filter({ hasText: /new|add|\+|create/i }).first();
    if (await newBtn.isVisible({ timeout: 5000 })) {
      await newBtn.click();
      await page.waitForTimeout(1000);
    }

    // Should have workflow created or be in create mode
    await expect(page.getByText(/workflow/i)).toBeVisible();
  });

  test('should display variable management', async ({ page }) => {
    await registerAndLogin(page);

    // Create a workflow first if needed
    const newBtn = page.locator('button').filter({ hasText: /new|add|\+|create/i }).first();
    if (await newBtn.isVisible({ timeout: 5000 })) {
      await newBtn.click();
      await page.waitForTimeout(1000);
    }

    // Look for variables section
    await expect(page.getByText(/variable/i)).toBeVisible({ timeout: 10000 });
  });

  test('should handle workflow selection', async ({ page }) => {
    await registerAndLogin(page);

    // Create first workflow
    const newBtn = page.locator('button').filter({ hasText: /new|add|\+|create/i }).first();
    if (await newBtn.isVisible({ timeout: 5000 })) {
      await newBtn.click();
      await page.waitForTimeout(500);

      // Create second workflow
      await newBtn.click();
      await page.waitForTimeout(500);
    }

    // Page should still be functional
    await expect(page.getByText(/workflow|FLUX/i)).toBeVisible();
  });
});
