import { expect, test } from './fixtures/test-fixtures';

test.describe('Tax Liens Page', () => {
  test('loads the tax liens page', async ({ taxLiensPage }) => {
    await taxLiensPage.goto();
    await taxLiensPage.expectPageLoaded();
  });

  test('displays summary stats cards', async ({ taxLiensPage }) => {
    await taxLiensPage.goto();
    await taxLiensPage.expectStatsCardsVisible();
  });

  test('displays the county bar chart', async ({ taxLiensPage }) => {
    await taxLiensPage.goto();
    await taxLiensPage.expectChartVisible();
  });

  test('displays the tax liens table', async ({ taxLiensPage }) => {
    await taxLiensPage.goto();
    await taxLiensPage.expectTableVisible();
  });

  test('filters by county', async ({ taxLiensPage, page }) => {
    await taxLiensPage.goto();
    await page.waitForTimeout(500); // Wait for data to load

    await taxLiensPage.selectCountyFilter('Bexar');
    await page.waitForTimeout(500); // Wait for filter to apply

    // The table should still be visible after filtering
    await taxLiensPage.expectTableVisible();
  });

  test('filters by status', async ({ taxLiensPage, page }) => {
    await taxLiensPage.goto();
    await page.waitForTimeout(500); // Wait for data to load

    await taxLiensPage.selectStatusFilter('active');
    await page.waitForTimeout(500); // Wait for filter to apply

    // The table should still be visible after filtering
    await taxLiensPage.expectTableVisible();
  });

  test('is responsive on mobile viewport', async ({ taxLiensPage, page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await taxLiensPage.goto();

    // Page should still load on mobile
    await taxLiensPage.expectPageLoaded();
    await taxLiensPage.expectStatsCardsVisible();
  });

  test('navigation link is visible in sidebar', async ({ page }) => {
    await page.goto('/mh-parks/dashboard');

    // The Tax Liens link should be visible in the sidebar
    await expect(page.getByRole('link', { name: /tax liens/i })).toBeVisible();
  });

  test('navigates from sidebar', async ({ page }) => {
    await page.goto('/mh-parks/dashboard');

    // Click the Tax Liens link
    await page.getByRole('link', { name: /tax liens/i }).click();

    // Should navigate to the tax liens page
    await expect(page).toHaveURL(/\/mh-parks\/tax-liens/);
    await expect(page.getByRole('heading', { name: /tax lien tracker/i })).toBeVisible();
  });
});
