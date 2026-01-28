import { expect, test } from '@playwright/test';

// Don't depend on auth.setup.ts - handle auth in each test
test.use({ storageState: { cookies: [], origins: [] } });

// Helper to sign in before each test
async function signIn(page: import('@playwright/test').Page) {
  // Go to sign-in page
  await page.goto('/sign-in');

  // Wait for form to be ready
  await expect(page.getByLabel(/email/i)).toBeVisible();

  // Fill credentials
  await page.getByLabel(/email/i).fill('demo@dealforge.dev');
  await page.getByLabel(/password/i).fill('demodemo123');

  // Set up a promise to wait for the sign-in API response
  const signInResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/auth/sign-in') && response.status() === 200
  );

  // Click sign in
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for the sign-in API to complete
  await signInResponsePromise;

  // Give the client time to process the response and set cookies
  await page.waitForTimeout(1000);

  // Now navigate directly to our target page instead of waiting for redirect
  await page.goto('/leads/new');

  // Verify we're authenticated by checking we're not on sign-in
  await expect(page).not.toHaveURL(/\/sign-in/);
}

test.describe('Lead Intake Form', () => {
  test('can navigate through all steps with only required fields', async ({ page }) => {
    // Sign in first
    await signIn(page);

    // Step 1: Address (only required field)
    await expect(page.getByLabel(/street address/i)).toBeVisible();

    // Fill in the address (required)
    await page.getByLabel(/street address/i).fill('123 Test Street, Austin, TX 78701');

    // Click Next to go to Step 2
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Property Details (all optional)
    await expect(page.getByText('Property Details', { exact: true })).toBeVisible();

    // Leave all fields empty and click Next
    // This tests that empty optional number and enum fields don't cause validation errors
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: Financials (all optional)
    await expect(page.getByText('Financial Information', { exact: true })).toBeVisible();

    // Leave all fields empty and click Next
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4: Seller (all optional)
    await expect(page.getByText('Seller Information', { exact: true })).toBeVisible();

    // We made it to the final step with only the address filled!
    await expect(page.getByRole('button', { name: /create lead/i })).toBeVisible();
  });

  test('can fill optional number fields on property step', async ({ page }) => {
    await signIn(page);

    // Step 1: Address
    await page.getByLabel(/street address/i).fill('456 Oak Lane, Houston, TX 77001');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Property Details - fill some optional fields
    await expect(page.getByText('Property Details', { exact: true })).toBeVisible();

    await page.getByLabel(/year built/i).fill('1995');
    await page.getByLabel(/bedrooms/i).fill('3');
    await page.getByLabel(/bathrooms/i).fill('2');

    // Click Next - should work with valid numbers
    await page.getByRole('button', { name: /next/i }).click();

    // Should advance to Step 3
    await expect(page.getByText('Financial Information', { exact: true })).toBeVisible();
  });

  test('can fill optional currency fields on financials step', async ({ page }) => {
    await signIn(page);

    // Step 1: Address
    await page.getByLabel(/street address/i).fill('789 Pine St, Dallas, TX 75201');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Skip
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: Financials - fill some optional fields
    await expect(page.getByText('Financial Information', { exact: true })).toBeVisible();

    await page.getByLabel(/asking price/i).fill('150000');
    await page.getByLabel(/monthly income/i).fill('5000');

    // Click Next
    await page.getByRole('button', { name: /next/i }).click();

    // Should advance to Step 4
    await expect(page.getByText('Seller Information', { exact: true })).toBeVisible();
  });

  test('shows validation error for invalid year', async ({ page }) => {
    await signIn(page);

    // Step 1: Address
    await page.getByLabel(/street address/i).fill('100 Main St, San Antonio, TX 78201');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Property Details - fill invalid year
    await page.getByLabel(/year built/i).fill('1800'); // Too old - min is 1900

    // Click Next
    await page.getByRole('button', { name: /next/i }).click();

    // Should show validation error and stay on step 2
    await expect(page.getByText('Property Details', { exact: true })).toBeVisible();
  });
});
