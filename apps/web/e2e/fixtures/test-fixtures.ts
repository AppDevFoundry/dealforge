import { test as base, expect } from '@playwright/test';

// ============================================
// Page Object Models
// ============================================

export class SignInPage {
  constructor(private page: import('@playwright/test').Page) {}

  async goto() {
    await this.page.goto('/sign-in');
  }

  async fillEmail(email: string) {
    await this.page.getByLabel(/email/i).fill(email);
  }

  async fillPassword(password: string) {
    await this.page.getByLabel(/password/i).fill(password);
  }

  async submit() {
    await this.page.getByRole('button', { name: /sign in/i }).click();
  }

  async signIn(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  async expectError(message: string | RegExp) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async clickGoogleSignIn() {
    await this.page.getByRole('button', { name: /google/i }).click();
  }

  async clickGitHubSignIn() {
    await this.page.getByRole('button', { name: /github/i }).click();
  }
}

export class DashboardPage {
  constructor(private page: import('@playwright/test').Page) {}

  async goto() {
    await this.page.goto('/dashboard');
  }

  async expectToBeOnDashboard() {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  async expectWelcomeMessage() {
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }
}

export class RentalCalculatorPage {
  constructor(private page: import('@playwright/test').Page) {}

  async goto() {
    await this.page.goto('/analyze/rental');
  }

  async setPurchasePrice(value: number) {
    const input = this.page.getByLabel(/purchase price/i);
    await input.clear();
    await input.fill(value.toString());
  }

  async setDownPayment(value: number) {
    const input = this.page.getByLabel(/down payment/i);
    await input.clear();
    await input.fill(value.toString());
  }

  async setMonthlyRent(value: number) {
    const input = this.page.getByLabel(/monthly rent/i);
    await input.clear();
    await input.fill(value.toString());
  }

  async setInterestRate(value: number) {
    const input = this.page.getByLabel(/interest rate/i);
    await input.clear();
    await input.fill(value.toString());
  }

  async toggleLearnMode() {
    await this.page.getByRole('switch', { name: /learn mode/i }).click();
  }

  async expectResultsVisible() {
    // Check that results section is visible
    await expect(this.page.getByText(/cash on cash/i)).toBeVisible();
  }

  async getMetricText(metricName: RegExp) {
    return this.page.getByText(metricName).textContent();
  }
}

export class MhParkCalculatorPage {
  constructor(private page: import('@playwright/test').Page) {}

  async goto() {
    await this.page.goto('/mh-parks/calculator');
  }

  async setLotCount(value: number) {
    const input = this.page.getByLabel(/total lots/i);
    await input.clear();
    await input.fill(value.toString());
  }

  async setOccupiedLots(value: number) {
    const input = this.page.getByLabel(/occupied lots/i);
    await input.clear();
    await input.fill(value.toString());
  }

  async setAvgLotRent(value: number) {
    const input = this.page.getByLabel(/average lot rent/i);
    await input.clear();
    await input.fill(value.toString());
  }

  async setPurchasePrice(value: number) {
    const input = this.page.getByLabel(/purchase price/i);
    await input.clear();
    await input.fill(value.toString());
  }

  async setDownPayment(value: number) {
    const input = this.page.getByLabel(/down payment/i);
    await input.clear();
    await input.fill(value.toString());
  }

  async setInterestRate(value: number) {
    const input = this.page.getByLabel(/interest rate/i);
    await input.clear();
    await input.fill(value.toString());
  }

  async setExpenseRatio(value: number) {
    const input = this.page.getByLabel(/expense ratio/i);
    await input.clear();
    await input.fill(value.toString());
  }

  async toggleLearnMode() {
    await this.page.getByRole('switch', { name: /learn mode/i }).click();
  }

  async expectResultsVisible() {
    // Check that results section is visible
    await expect(this.page.getByText(/cap rate/i)).toBeVisible();
    await expect(this.page.getByText(/cash on cash/i)).toBeVisible();
  }

  async getMetricText(metricName: RegExp) {
    return this.page.getByText(metricName).textContent();
  }
}

export class MhParkMapPage {
  constructor(private page: import('@playwright/test').Page) {}

  async goto() {
    await this.page.goto('/mh-parks');
  }

  async expectMapVisible() {
    // Check that the map container is visible
    await expect(this.page.locator('.mapboxgl-map')).toBeVisible();
  }

  async selectPropertyTypeFilter(type: string) {
    const trigger = this.page.getByRole('combobox');
    await trigger.click();
    await this.page.getByRole('option', { name: new RegExp(type, 'i') }).click();
  }

  async expectParksCount(expectedText: RegExp) {
    await expect(this.page.getByText(expectedText)).toBeVisible();
  }
}

export class MhParkSearchPage {
  constructor(private page: import('@playwright/test').Page) {}

  async goto() {
    await this.page.goto('/mh-parks/search');
  }

  async selectCounty(county: string) {
    const countySelect = this.page.getByLabel(/county/i);
    await countySelect.click();
    await this.page.getByRole('option', { name: new RegExp(county, 'i') }).click();
  }

  async setMinLots(value: number) {
    const input = this.page.getByLabel(/minimum lots/i);
    await input.clear();
    await input.fill(value.toString());
  }

  async setMaxLots(value: number) {
    const input = this.page.getByLabel(/maximum lots/i);
    await input.clear();
    await input.fill(value.toString());
  }

  async clickExportCSV() {
    await this.page.getByRole('button', { name: /export csv/i }).click();
  }

  async expectResultsCount(expectedText: RegExp) {
    await expect(this.page.getByText(expectedText)).toBeVisible();
  }
}

export class MhParkDashboardPage {
  constructor(private page: import('@playwright/test').Page) {}

  async goto() {
    await this.page.goto('/mh-parks/dashboard');
  }

  async expectChartVisible() {
    // Check that the titling trends chart container is visible
    await expect(this.page.locator('.recharts-responsive-container')).toBeVisible();
  }

  async expectSummaryCardsVisible() {
    await expect(this.page.getByText(/total parks/i)).toBeVisible();
    await expect(this.page.getByText(/total lots/i)).toBeVisible();
  }

  async selectCounty(county: string) {
    const countySelect = this.page.getByLabel(/county/i);
    await countySelect.click();
    await this.page.getByRole('option', { name: new RegExp(county, 'i') }).click();
  }
}

export class TaxLiensPage {
  constructor(private page: import('@playwright/test').Page) {}

  async goto() {
    await this.page.goto('/mh-parks/tax-liens');
  }

  async expectPageLoaded() {
    await expect(this.page.getByRole('heading', { name: /tax lien tracker/i })).toBeVisible();
  }

  async expectStatsCardsVisible() {
    await expect(this.page.getByText(/active liens/i)).toBeVisible();
    await expect(this.page.getByText(/total amount/i)).toBeVisible();
    await expect(this.page.getByText(/avg amount/i)).toBeVisible();
  }

  async expectChartVisible() {
    // Check that the bar chart container is visible
    await expect(this.page.locator('.recharts-responsive-container')).toBeVisible();
  }

  async expectTableVisible() {
    await expect(this.page.getByRole('table')).toBeVisible();
  }

  async selectCountyFilter(county: string) {
    const countySelect = this.page.getByRole('combobox').first();
    await countySelect.click();
    await this.page.getByRole('option', { name: new RegExp(county, 'i') }).click();
  }

  async selectStatusFilter(status: 'active' | 'released') {
    const statusSelect = this.page.getByRole('combobox').nth(1);
    await statusSelect.click();
    await this.page.getByRole('option', { name: new RegExp(status, 'i') }).click();
  }

  async clearCountyFilter() {
    const countySelect = this.page.getByRole('combobox').first();
    await countySelect.click();
    await this.page.getByRole('option', { name: /all counties/i }).click();
  }

  async expectLienCount(expectedText: RegExp) {
    await expect(this.page.getByText(expectedText)).toBeVisible();
  }

  async expectCommunityLink(communityName: string) {
    await expect(
      this.page.getByRole('link', { name: new RegExp(communityName, 'i') })
    ).toBeVisible();
  }
}

// ============================================
// Extended Test Fixture
// ============================================

type TestFixtures = {
  signInPage: SignInPage;
  dashboardPage: DashboardPage;
  rentalCalculatorPage: RentalCalculatorPage;
  mhParkCalculatorPage: MhParkCalculatorPage;
  mhParkMapPage: MhParkMapPage;
  mhParkSearchPage: MhParkSearchPage;
  mhParkDashboardPage: MhParkDashboardPage;
  taxLiensPage: TaxLiensPage;
};

export const test = base.extend<TestFixtures>({
  signInPage: async ({ page }, use) => {
    await use(new SignInPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  rentalCalculatorPage: async ({ page }, use) => {
    await use(new RentalCalculatorPage(page));
  },
  mhParkCalculatorPage: async ({ page }, use) => {
    await use(new MhParkCalculatorPage(page));
  },
  mhParkMapPage: async ({ page }, use) => {
    await use(new MhParkMapPage(page));
  },
  mhParkSearchPage: async ({ page }, use) => {
    await use(new MhParkSearchPage(page));
  },
  mhParkDashboardPage: async ({ page }, use) => {
    await use(new MhParkDashboardPage(page));
  },
  taxLiensPage: async ({ page }, use) => {
    await use(new TaxLiensPage(page));
  },
});

export { expect };
