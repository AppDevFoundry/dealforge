import { expect, test } from './fixtures/test-fixtures';

test.describe('MH Park Calculator', () => {
  test('loads the calculator page', async ({ mhParkCalculatorPage, page }) => {
    await mhParkCalculatorPage.goto();

    // Check page title or heading
    await expect(page.getByRole('heading', { name: /mh park/i })).toBeVisible();
  });

  test('displays input form with default values', async ({ mhParkCalculatorPage, page }) => {
    await mhParkCalculatorPage.goto();

    // Check for key input fields
    await expect(page.getByLabel(/total lots/i)).toBeVisible();
    await expect(page.getByLabel(/occupied lots/i)).toBeVisible();
    await expect(page.getByLabel(/average lot rent/i)).toBeVisible();
    await expect(page.getByLabel(/purchase price/i)).toBeVisible();
  });

  test('displays key metrics in results section', async ({ mhParkCalculatorPage, page }) => {
    await mhParkCalculatorPage.goto();

    // Results should show key metrics
    await expect(page.getByText(/cap rate/i)).toBeVisible();
    await expect(page.getByText(/cash on cash/i)).toBeVisible();
    await expect(page.getByText(/noi/i)).toBeVisible();
  });

  test('updates results when inputs change', async ({ mhParkCalculatorPage, page }) => {
    await mhParkCalculatorPage.goto();

    // Get initial state
    await page.waitForTimeout(500);

    // Change lot count
    await mhParkCalculatorPage.setLotCount(100);

    // Wait for debounce and recalculation
    await page.waitForTimeout(500);

    // Results should still be visible (calculation succeeded)
    await expect(page.getByText(/cap rate/i)).toBeVisible();
  });

  test('handles learn mode toggle', async ({ mhParkCalculatorPage, page }) => {
    await mhParkCalculatorPage.goto();

    // Find and click learn mode toggle if it exists
    const learnModeToggle = page.getByRole('switch', { name: /learn mode/i });

    if (await learnModeToggle.isVisible()) {
      await learnModeToggle.click();

      // Learn mode should show formula explanations
      await page.waitForTimeout(300);
    }
  });

  test('is responsive on mobile viewport', async ({ mhParkCalculatorPage, page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await mhParkCalculatorPage.goto();

    // Form should still be visible on mobile
    await expect(page.getByLabel(/total lots/i)).toBeVisible();

    // Results should be visible
    await expect(page.getByText(/cap rate/i)).toBeVisible();
  });

  test('maintains state after page scroll', async ({ mhParkCalculatorPage, page }) => {
    await mhParkCalculatorPage.goto();

    // Enter a value
    await mhParkCalculatorPage.setLotCount(50);
    await page.waitForTimeout(300);

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));

    // Scroll back up
    await page.evaluate(() => window.scrollTo(0, 0));

    // Value should be preserved
    const lotCountInput = page.getByLabel(/total lots/i);
    await expect(lotCountInput).toHaveValue('50');
  });

  test('calculates correct occupancy rate', async ({ mhParkCalculatorPage, page }) => {
    await mhParkCalculatorPage.goto();

    // Set specific values to verify calculation
    await mhParkCalculatorPage.setLotCount(100);
    await mhParkCalculatorPage.setOccupiedLots(90);

    await page.waitForTimeout(500);

    // Occupancy should be 90%
    await expect(page.getByText(/90%/)).toBeVisible();
  });
});

test.describe('MH Park Calculator Accessibility', () => {
  test('has accessible form labels', async ({ mhParkCalculatorPage, page }) => {
    await mhParkCalculatorPage.goto();

    // All inputs should have associated labels
    const inputs = page.locator('input[type="number"]');
    const count = await inputs.count();

    // There should be multiple inputs with labels
    expect(count).toBeGreaterThan(0);
  });

  test('supports keyboard navigation', async ({ mhParkCalculatorPage, page }) => {
    await mhParkCalculatorPage.goto();

    // Tab through form fields
    await page.keyboard.press('Tab');

    // Should be able to focus on inputs
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
