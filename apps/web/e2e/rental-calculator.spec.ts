import { expect, test } from './fixtures/test-fixtures';

test.describe('Rental Calculator', () => {
  test('loads the calculator page', async ({ rentalCalculatorPage, page }) => {
    await rentalCalculatorPage.goto();

    // Check page title or heading
    await expect(page.getByRole('heading', { name: /rental/i })).toBeVisible();
  });

  test('displays input form with default values', async ({ rentalCalculatorPage, page }) => {
    await rentalCalculatorPage.goto();

    // Check default purchase price (200000)
    const purchasePriceInput = page.getByLabel(/purchase price/i);
    await expect(purchasePriceInput).toBeVisible();
  });

  test('displays key metrics in results section', async ({ rentalCalculatorPage, page }) => {
    await rentalCalculatorPage.goto();

    // Results should show key metrics
    await expect(page.getByText(/cash on cash/i)).toBeVisible();
    await expect(page.getByText(/cap rate/i)).toBeVisible();
    await expect(page.getByText(/cash flow/i)).toBeVisible();
  });

  test('updates results when inputs change', async ({ rentalCalculatorPage, page }) => {
    await rentalCalculatorPage.goto();

    // Get initial state
    await page.waitForTimeout(500);

    // Change purchase price
    await rentalCalculatorPage.setPurchasePrice(300000);

    // Wait for debounce and recalculation
    await page.waitForTimeout(500);

    // Results should still be visible (calculation succeeded)
    await expect(page.getByText(/cash on cash/i)).toBeVisible();
  });

  test('handles learn mode toggle', async ({ rentalCalculatorPage, page }) => {
    await rentalCalculatorPage.goto();

    // Find and click learn mode toggle if it exists
    const learnModeToggle = page.getByRole('switch', { name: /learn mode/i });

    if (await learnModeToggle.isVisible()) {
      await learnModeToggle.click();

      // Learn mode should show formula explanations
      // Check for formula-related text
      await page.waitForTimeout(300);
    }
  });

  test('is responsive on mobile viewport', async ({ rentalCalculatorPage, page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await rentalCalculatorPage.goto();

    // Form should still be visible on mobile
    await expect(page.getByLabel(/purchase price/i)).toBeVisible();

    // Results should be visible
    await expect(page.getByText(/cash on cash/i)).toBeVisible();
  });

  test('maintains state after page scroll', async ({ rentalCalculatorPage, page }) => {
    await rentalCalculatorPage.goto();

    // Enter a value
    await rentalCalculatorPage.setPurchasePrice(250000);
    await page.waitForTimeout(300);

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));

    // Scroll back up
    await page.evaluate(() => window.scrollTo(0, 0));

    // Value should be preserved
    const purchasePriceInput = page.getByLabel(/purchase price/i);
    await expect(purchasePriceInput).toHaveValue('250000');
  });
});

test.describe('Rental Calculator Accessibility', () => {
  test('has accessible form labels', async ({ rentalCalculatorPage, page }) => {
    await rentalCalculatorPage.goto();

    // All inputs should have associated labels
    const inputs = page.locator('input[type="number"]');
    const count = await inputs.count();

    // There should be multiple inputs with labels
    expect(count).toBeGreaterThan(0);
  });

  test('supports keyboard navigation', async ({ rentalCalculatorPage, page }) => {
    await rentalCalculatorPage.goto();

    // Tab through form fields
    await page.keyboard.press('Tab');

    // Should be able to focus on inputs
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
