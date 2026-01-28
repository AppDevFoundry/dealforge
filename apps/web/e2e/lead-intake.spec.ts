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
    await page.getByLabel(/street address/i).fill('123 Test Street, Austin, TX 78701');
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Property Details (all optional) - leave empty
    await expect(page.getByText('Property Details', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: Financials (all optional) - leave empty
    await expect(page.getByText('Financial Information', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4: Seller (all optional)
    await expect(page.getByLabel(/seller name/i)).toBeVisible();
    await expect(page).toHaveURL(/\/leads\/new/);

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

  test('can create a lead with only required address field', async ({ page }) => {
    await signIn(page);

    // Listen to console for any errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Use a unique address to avoid conflicts with previous test runs
    const testAddress = `${Date.now()} Test Street, Austin, TX 78701`;

    // Step 1: Address - ensure we're on the right page first
    await expect(page.getByLabel(/street address/i)).toBeVisible();
    await page.getByLabel(/street address/i).fill(testAddress);
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Skip property details - wait for step to be visible
    await expect(page.getByText('Property Details', { exact: true })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: Skip financials - wait for step to be visible
    await expect(page.getByText('Financial Information', { exact: true })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4: Skip seller info - wait for step to be visible
    await expect(page.getByText('Seller Information', { exact: true })).toBeVisible({ timeout: 5000 });

    // Click Create Lead - ensure button is visible and enabled
    const createButton = page.getByRole('button', { name: /create lead/i });
    await expect(createButton).toBeVisible({ timeout: 5000 });
    await expect(createButton).toBeEnabled();

    // Click and wait for API response
    const [response] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/v1/leads') && resp.request().method() === 'POST',
        { timeout: 10000 }
      ),
      createButton.click(),
    ]);

    const apiResponseStatus = response.status();
    const apiResponseBody = await response.json().catch(() => null);

    // Log results for debugging
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors);
    }
    console.log('API Response:', apiResponseStatus, JSON.stringify(apiResponseBody));

    // Verify the API returned success (201)
    expect(apiResponseStatus).toBe(201);

    // Should redirect to lead detail page
    await expect(page).toHaveURL(/\/leads\/lead_/, { timeout: 5000 });

    // Verify the lead detail page loads with the correct address
    await expect(page.getByRole('heading', { name: testAddress })).toBeVisible({ timeout: 10000 });
  });

  test('lead detail page shows intelligence after analysis', async ({ page }) => {
    await signIn(page);

    // Use a unique address
    const testAddress = `${Date.now()} Oak Street, San Antonio, TX 78201`;

    // Step 1: Address
    await expect(page.getByLabel(/street address/i)).toBeVisible();
    await page.getByLabel(/street address/i).fill(testAddress);
    await page.getByRole('button', { name: /next/i }).click();

    // Step 2: Skip property
    await expect(page.getByText('Property Details', { exact: true })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /next/i }).click();

    // Step 3: Skip financials
    await expect(page.getByText('Financial Information', { exact: true })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /next/i }).click();

    // Step 4: Skip seller
    await expect(page.getByText('Seller Information', { exact: true })).toBeVisible({ timeout: 5000 });

    const [response] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/v1/leads') && resp.request().method() === 'POST',
        { timeout: 10000 }
      ),
      page.getByRole('button', { name: /create lead/i }).click(),
    ]);

    expect(response.status()).toBe(201);

    // Wait for redirect to detail page
    await expect(page).toHaveURL(/\/leads\/lead_/, { timeout: 5000 });

    // The lead should show as "Analyzing" initially
    await expect(
      page.getByText(/analyzing/i).or(page.getByText(/analyzed/i))
    ).toBeVisible({ timeout: 5000 });

    // The address should be visible in the heading
    await expect(page.getByRole('heading', { name: testAddress })).toBeVisible();

    // Wait for analysis to complete (status should change to "analyzed")
    // This may take a while if intelligence gathering is slow
    await expect(page.getByText(/analyzed/i)).toBeVisible({ timeout: 30000 });
  });
});
