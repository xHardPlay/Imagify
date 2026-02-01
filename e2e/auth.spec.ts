import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page by default', async ({ page }) => {
    await page.goto('/');

    // Should see the login form (using id selectors based on actual Login.tsx)
    await expect(page.getByRole('heading', { name: 'LOGIN' })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('should validate email format on login', async ({ page }) => {
    await page.goto('/');

    await page.locator('#email').fill('invalid-email');
    await page.locator('#password').fill('Password123');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // HTML5 validation should prevent submission
    await expect(page.locator('#email')).toHaveAttribute('type', 'email');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');

    await page.locator('#email').fill('wrong@example.com');
    await page.locator('#password').fill('WrongPassword123');
    await page.getByRole('button', { name: 'LOGIN' }).click();

    // Should show error message
    await expect(page.getByText(/error|failed|invalid/i)).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/');

    // Click on register button (it's a button, not a link)
    await page.getByRole('button', { name: 'Register' }).click();

    // Should see register form (heading is "CREATE ACCOUNT")
    await expect(page.getByRole('heading', { name: 'CREATE ACCOUNT' })).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
  });

  test('should validate password requirements on register', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Register' }).click();

    await page.locator('#email').fill('test@example.com');
    await page.locator('#password').fill('weak');

    // Password requirements should be visible
    await expect(page.getByText('8+ characters')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Uppercase')).toBeVisible();
    await expect(page.getByText('Lowercase')).toBeVisible();
    await expect(page.getByText('Number')).toBeVisible();
  });

  test('should validate password match on register', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Register' }).click();

    await page.locator('#email').fill('test@example.com');
    await page.locator('#password').fill('Password123');
    await page.locator('#confirmPassword').fill('DifferentPassword123');

    // Should show passwords don't match error (appears inline, button stays disabled)
    await expect(page.getByText('Passwords do not match')).toBeVisible({ timeout: 5000 });
  });

  test('should register new user successfully', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Register' }).click();

    const uniqueEmail = `test-${Date.now()}@example.com`;

    await page.locator('#email').fill(uniqueEmail);
    await page.locator('#password').fill('TestPassword123');
    await page.locator('#confirmPassword').fill('TestPassword123');

    await page.getByRole('button', { name: /register|create/i }).click();

    // Should redirect to main app after successful registration
    await expect(page.getByText(/workflow|FLUX Studio/i)).toBeVisible({ timeout: 20000 });
  });
});
