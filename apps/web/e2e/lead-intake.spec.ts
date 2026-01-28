import { expect, test } from '@playwright/test';

// Helper to sign in before each test
async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/sign-in');
  await page.getByLabel(/email/i).fill('demo@dealforge.dev');
  await page.getByLabel(/password/i).fill('demodemo123');
  await page.getByRole('button', { name: /sign in/i }).click();
  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

test.describe('Lead Intake Form', () => {
  test('can navigate through all steps with only required fields', async ({ page }) => {
    // Sign in first
    await signIn(page);

    // Navigate to the lead intake form
    await page.goto('/leads/new');

    // Step 1: Address (only required field)
    await expect(page.getByText('Property Address')).toBeVisible();

    // Fill in the address (required)
    await page.getByLabel(/street address/i).fill('123 Test Street, Austin, TX 78701');

    // Click Next to go to Step 2
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Property Details (all optional)
    await expect(page.getByText('Property Details')).toBeVisible();
    await expect(page.getByText('All fields are optional')).toBeVisible();

    // Leave all fields empty and click Next - THIS IS THE BUG FIX TEST
    // Previously this would fail with "Expected number, received nan"
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: Financials (all optional)
    await expect(page.getByText('Financial Information')).toBeVisible();

    // Leave all fields empty and click Next
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4: Seller (all optional)
    await expect(page.getByText('Seller Information')).toBeVisible();

    // We made it to the final step with only the address filled!
    await expect(page.getByRole('button', { name: /create lead/i })).toBeVisible();
  });

  test('can fill optional number fields on property step', async ({ page }) => {
    await signIn(page);
    await page.goto('/leads/new');

    // Step 1: Address
    await page.getByLabel(/street address/i).fill('456 Oak Lane, Houston, TX 77001');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Property Details - fill some optional fields
    await expect(page.getByText('Property Details')).toBeVisible();

    await page.getByLabel(/year built/i).fill('1995');
    await page.getByLabel(/bedrooms/i).fill('3');
    await page.getByLabel(/bathrooms/i).fill('2');

    // Click Next - should work with valid numbers
    await page.getByRole('button', { name: /next/i }).click();

    // Should advance to Step 3
    await expect(page.getByText('Financial Information')).toBeVisible();
  });

  test('can fill optional currency fields on financials step', async ({ page }) => {
    await signIn(page);
    await page.goto('/leads/new');

    // Step 1: Address
    await page.getByLabel(/street address/i).fill('789 Pine St, Dallas, TX 75201');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Skip
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: Financials - fill some optional fields
    await expect(page.getByText('Financial Information')).toBeVisible();

    await page.getByLabel(/asking price/i).fill('150000');
    await page.getByLabel(/monthly income/i).fill('5000');

    // Click Next
    await page.getByRole('button', { name: /next/i }).click();

    // Should advance to Step 4
    await expect(page.getByText('Seller Information')).toBeVisible();
  });

  test('shows validation error for invalid year', async ({ page }) => {
    await signIn(page);
    await page.goto('/leads/new');

    // Step 1: Address
    await page.getByLabel(/street address/i).fill('100 Main St, San Antonio, TX 78201');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Property Details - fill invalid year
    await page.getByLabel(/year built/i).fill('1800'); // Too old - min is 1900

    // Click Next
    await page.getByRole('button', { name: /next/i }).click();

    // Should show validation error and stay on step 2
    await expect(page.getByText('Property Details')).toBeVisible();
  });
});
