import { test as setup, expect } from '@playwright/test';
import path from 'node:path';

const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Skip auth setup if running against a test environment without real auth
  if (process.env.SKIP_AUTH_SETUP === 'true') {
    // Create empty auth state
    await page.context().storageState({ path: authFile });
    return;
  }

  // Check if we have test credentials
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  if (!testEmail || !testPassword) {
    console.log('No TEST_USER_EMAIL or TEST_USER_PASSWORD set, creating empty auth state');
    await page.context().storageState({ path: authFile });
    return;
  }

  // Navigate to sign-in page
  await page.goto('/sign-in');

  // Fill in credentials
  await page.getByLabel(/email/i).fill(testEmail);
  await page.getByLabel(/password/i).fill(testPassword);

  // Submit form
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
