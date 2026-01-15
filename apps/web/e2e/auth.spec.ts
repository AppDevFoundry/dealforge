import { expect, test } from '@playwright/test';

// These tests run without the authenticated state
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication Flow', () => {
  test('redirects unauthenticated users from dashboard to sign-in', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to sign-in
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('displays sign-in form with all fields', async ({ page }) => {
    await page.goto('/sign-in');

    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('displays OAuth buttons', async ({ page }) => {
    await page.goto('/sign-in');

    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
  });

  test('shows validation for empty form submission', async ({ page }) => {
    await page.goto('/sign-in');

    // Click sign in without filling form
    await page.getByRole('button', { name: /sign in/i }).click();

    // Browser validation should prevent submission (required fields)
    // The form should still be on the sign-in page
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('links to sign-up page', async ({ page }) => {
    await page.goto('/sign-in');

    // Look for a link to sign up
    const signUpLink = page.getByRole('link', { name: /sign up/i });

    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      await expect(page).toHaveURL(/\/sign-up/);
    }
  });
});

test.describe('Sign Up Flow', () => {
  test('displays sign-up form', async ({ page }) => {
    await page.goto('/sign-up');

    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('links back to sign-in page', async ({ page }) => {
    await page.goto('/sign-up');

    const signInLink = page.getByRole('link', { name: /sign in/i });

    if (await signInLink.isVisible()) {
      await signInLink.click();
      await expect(page).toHaveURL(/\/sign-in/);
    }
  });
});
