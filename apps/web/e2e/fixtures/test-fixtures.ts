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

// ============================================
// Extended Test Fixture
// ============================================

type TestFixtures = {
  signInPage: SignInPage;
  dashboardPage: DashboardPage;
  rentalCalculatorPage: RentalCalculatorPage;
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
});

export { expect };
