# DealForge Testing Setup Prompt

Use this prompt with your coding agent to set up a comprehensive testing framework.

---

## Prompt

```
I need to set up a comprehensive testing framework for DealForge, a Next.js 15 monorepo with Turborepo. The project structure includes:

- `apps/web` - Next.js 15 (App Router) application
- `packages/database` - Drizzle ORM schemas
- `packages/types` - Shared TypeScript types
- `packages/calc-engine` - Rust calculation library (future WASM)
- `services/data-sync` - Go service

Please set up testing infrastructure following these requirements:

## Testing Stack

- **Unit & Integration Tests**: Vitest (NOT Jest)
- **Component Tests**: React Testing Library + Vitest
- **E2E Tests**: Playwright
- **API Mocking**: MSW (Mock Service Worker) v2
- **Coverage**: Vitest coverage with v8

## Directory Structure

Create this testing structure:

```
apps/web/
├── __tests__/
│   ├── unit/           # Pure function tests
│   ├── components/     # React component tests
│   ├── integration/    # API route tests
│   └── utils/          # Test utilities, factories, mocks
├── e2e/                # Playwright E2E tests
│   ├── fixtures/       # Test fixtures and page objects
│   └── *.spec.ts       # Test files
├── vitest.config.ts
├── playwright.config.ts
└── vitest.setup.ts

packages/database/
├── __tests__/
│   └── *.test.ts
└── vitest.config.ts

packages/types/
├── __tests__/
│   └── *.test.ts
└── vitest.config.ts
```

## Root Configuration

### 1. Root `package.json` Scripts

Add these scripts to the root package.json:

```json
{
  "scripts": {
    "test": "turbo test",
    "test:unit": "turbo test:unit",
    "test:e2e": "turbo test:e2e",
    "test:coverage": "turbo test:coverage",
    "test:watch": "turbo test:watch"
  }
}
```

### 2. Turborepo Pipeline (`turbo.json`)

Configure test tasks in the pipeline:

```json
{
  "tasks": {
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "__tests__/**", "vitest.config.ts"],
      "outputs": ["coverage/**"]
    },
    "test:unit": {
      "dependsOn": ["^build"],
      "inputs": ["src/**", "__tests__/**"]
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "inputs": ["src/**", "e2e/**"]
    },
    "test:coverage": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

## Apps/Web Configuration

### 1. Install Dependencies

```bash
pnpm add -D --filter @dealforge/web \
  vitest \
  @vitest/coverage-v8 \
  @vitest/ui \
  @testing-library/react \
  @testing-library/user-event \
  @testing-library/jest-dom \
  jsdom \
  msw \
  @playwright/test
```

### 2. Vitest Configuration (`apps/web/vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/**',
        '__tests__/**',
        '**/*.d.ts',
        '**/*.config.{ts,js}',
        '**/types/**',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
```

### 3. Vitest Setup (`apps/web/vitest.setup.ts`)

```typescript
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { server } from './__tests__/utils/msw/server';

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test for isolation
afterEach(() => {
  cleanup();
  server.resetHandlers();
});

// Clean up after all tests
afterAll(() => server.close());

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock environment variables
vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
```

### 4. Playwright Configuration (`apps/web/playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    process.env.CI ? ['github'] : ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### 5. MSW Setup (`apps/web/__tests__/utils/msw/`)

Create these files:

**handlers.ts** - API mock handlers:
```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok' });
  }),

  // Deals API
  http.get('/api/v1/deals', () => {
    return HttpResponse.json({
      success: true,
      data: [],
      meta: { pagination: { page: 1, perPage: 20, total: 0, totalPages: 0 } },
    });
  }),

  http.post('/api/v1/deals', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: { id: 'deal_123', ...body },
    }, { status: 201 });
  }),

  // Calculations API
  http.post('/api/v1/calculate/rental', async ({ request }) => {
    const inputs = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        cashOnCashReturn: 8.5,
        capRate: 7.2,
        monthlyCashFlow: 250,
        // ... mock results
      },
    });
  }),
];
```

**server.ts** - MSW server:
```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

**browser.ts** - For Storybook or browser testing:
```typescript
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

### 6. Test Utilities (`apps/web/__tests__/utils/`)

**render.tsx** - Custom render with providers:
```typescript
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Add your providers here
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Add context providers as needed */}
      {children}
    </>
  );
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...options }),
  };
}

export * from '@testing-library/react';
export { customRender as render };
```

**factories.ts** - Test data factories:
```typescript
import type { Deal, RentalInputs, RentalResults } from '@dealforge/types';

export function createDeal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: `deal_${Math.random().toString(36).slice(2)}`,
    userId: 'user_123',
    type: 'rental',
    name: 'Test Property',
    status: 'analyzing',
    inputs: createRentalInputs(),
    results: createRentalResults(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createRentalInputs(overrides: Partial<RentalInputs> = {}): RentalInputs {
  return {
    purchasePrice: 200000,
    closingCosts: 5000,
    rehabCosts: 0,
    downPaymentPercent: 20,
    interestRate: 7,
    loanTermYears: 30,
    monthlyRent: 1800,
    otherIncome: 0,
    vacancyRate: 5,
    propertyTaxAnnual: 3000,
    insuranceAnnual: 1200,
    hoaMonthly: 0,
    maintenancePercent: 5,
    capexPercent: 5,
    managementPercent: 8,
    ...overrides,
  };
}

export function createRentalResults(overrides: Partial<RentalResults> = {}): RentalResults {
  return {
    cashOnCashReturn: 8.5,
    capRate: 7.2,
    totalRoi: 12.3,
    monthlyCashFlow: 250,
    annualCashFlow: 3000,
    totalInvestment: 45000,
    loanAmount: 160000,
    monthlyMortgage: 1065,
    grossMonthlyIncome: 1800,
    effectiveGrossIncome: 1710,
    totalMonthlyExpenses: 395,
    netOperatingIncome: 15780,
    debtServiceCoverageRatio: 1.23,
    ...overrides,
  };
}
```

## Example Tests

### Unit Test Example (`apps/web/__tests__/unit/calculations.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { calculateCashOnCash, calculateCapRate } from '@/lib/calculations';
import { createRentalInputs } from '../utils/factories';

describe('Calculation utilities', () => {
  describe('calculateCashOnCash', () => {
    it('should calculate cash-on-cash return correctly', () => {
      const annualCashFlow = 3000;
      const totalInvestment = 45000;

      const result = calculateCashOnCash(annualCashFlow, totalInvestment);

      expect(result).toBeCloseTo(6.67, 2);
    });

    it('should return 0 when investment is 0', () => {
      const result = calculateCashOnCash(3000, 0);
      expect(result).toBe(0);
    });

    it('should handle negative cash flow', () => {
      const result = calculateCashOnCash(-1200, 45000);
      expect(result).toBeCloseTo(-2.67, 2);
    });
  });

  describe('calculateCapRate', () => {
    it('should calculate cap rate correctly', () => {
      const noi = 15000;
      const purchasePrice = 200000;

      const result = calculateCapRate(noi, purchasePrice);

      expect(result).toBeCloseTo(7.5, 2);
    });
  });
});
```

### Component Test Example (`apps/web/__tests__/components/RentalForm.test.tsx`)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../utils/render';
import { RentalForm } from '@/components/calculators/RentalForm';
import { createRentalInputs } from '../utils/factories';

describe('RentalForm', () => {
  it('should render all input fields', () => {
    render(<RentalForm onCalculate={vi.fn()} />);

    expect(screen.getByLabelText(/purchase price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/monthly rent/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/down payment/i)).toBeInTheDocument();
  });

  it('should call onCalculate with form values when submitted', async () => {
    const onCalculate = vi.fn();
    const { user } = render(<RentalForm onCalculate={onCalculate} />);

    await user.type(screen.getByLabelText(/purchase price/i), '200000');
    await user.type(screen.getByLabelText(/monthly rent/i), '1800');
    await user.click(screen.getByRole('button', { name: /calculate/i }));

    await waitFor(() => {
      expect(onCalculate).toHaveBeenCalledWith(
        expect.objectContaining({
          purchasePrice: 200000,
          monthlyRent: 1800,
        })
      );
    });
  });

  it('should display validation errors for invalid inputs', async () => {
    const { user } = render(<RentalForm onCalculate={vi.fn()} />);

    await user.type(screen.getByLabelText(/purchase price/i), '-100');
    await user.click(screen.getByRole('button', { name: /calculate/i }));

    await waitFor(() => {
      expect(screen.getByText(/must be a positive number/i)).toBeInTheDocument();
    });
  });

  it('should pre-fill with default values', () => {
    const defaults = createRentalInputs({ purchasePrice: 300000 });
    render(<RentalForm onCalculate={vi.fn()} defaultValues={defaults} />);

    expect(screen.getByLabelText(/purchase price/i)).toHaveValue(300000);
  });
});
```

### Integration Test Example (`apps/web/__tests__/integration/deals-api.test.ts`)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '../utils/msw/server';
import { http, HttpResponse } from 'msw';

describe('Deals API', () => {
  describe('GET /api/v1/deals', () => {
    it('should return empty array when no deals exist', async () => {
      const response = await fetch('/api/v1/deals');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it('should return deals when they exist', async () => {
      server.use(
        http.get('/api/v1/deals', () => {
          return HttpResponse.json({
            success: true,
            data: [
              { id: 'deal_1', name: 'Property 1' },
              { id: 'deal_2', name: 'Property 2' },
            ],
          });
        })
      );

      const response = await fetch('/api/v1/deals');
      const data = await response.json();

      expect(data.data).toHaveLength(2);
    });
  });

  describe('POST /api/v1/deals', () => {
    it('should create a new deal', async () => {
      const newDeal = {
        type: 'rental',
        name: 'Test Property',
        inputs: { purchasePrice: 200000 },
      };

      const response = await fetch('/api/v1/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeal),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.id).toBeDefined();
    });
  });
});
```

### E2E Test Example (`apps/web/e2e/rental-calculator.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Rental Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analyze/rental');
  });

  test('should calculate and display results', async ({ page }) => {
    // Fill in the form
    await page.getByLabel(/purchase price/i).fill('200000');
    await page.getByLabel(/down payment/i).fill('20');
    await page.getByLabel(/interest rate/i).fill('7');
    await page.getByLabel(/monthly rent/i).fill('1800');

    // Submit
    await page.getByRole('button', { name: /calculate/i }).click();

    // Verify results appear
    await expect(page.getByTestId('cash-on-cash')).toBeVisible();
    await expect(page.getByTestId('cap-rate')).toBeVisible();
    await expect(page.getByTestId('monthly-cash-flow')).toBeVisible();
  });

  test('should save deal to library', async ({ page }) => {
    // Fill and calculate
    await page.getByLabel(/purchase price/i).fill('150000');
    await page.getByLabel(/monthly rent/i).fill('1200');
    await page.getByRole('button', { name: /calculate/i }).click();

    // Save
    await page.getByRole('button', { name: /save deal/i }).click();
    await page.getByLabel(/deal name/i).fill('My Test Property');
    await page.getByRole('button', { name: /confirm/i }).click();

    // Verify saved
    await expect(page.getByText(/deal saved/i)).toBeVisible();

    // Navigate to library and verify
    await page.goto('/deals');
    await expect(page.getByText('My Test Property')).toBeVisible();
  });

  test('should show validation errors', async ({ page }) => {
    await page.getByLabel(/purchase price/i).fill('-100');
    await page.getByRole('button', { name: /calculate/i }).click();

    await expect(page.getByText(/must be positive/i)).toBeVisible();
  });
});
```

### E2E Auth Setup (`apps/web/e2e/fixtures/auth.setup.ts`)

```typescript
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Go to sign in
  await page.goto('/sign-in');

  // Sign in with test credentials
  await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard');

  // Save auth state
  await page.context().storageState({ path: authFile });
});
```

## Package Tests

### Database Package (`packages/database/vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    include: ['__tests__/**/*.{test,spec}.ts'],
  },
});
```

### Types Package (`packages/types/__tests__/validation.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { RentalInputsSchema } from '../src/schemas';

describe('RentalInputsSchema', () => {
  it('should validate correct inputs', () => {
    const validInputs = {
      purchasePrice: 200000,
      monthlyRent: 1800,
      downPaymentPercent: 20,
      interestRate: 7,
      // ... other required fields
    };

    const result = RentalInputsSchema.safeParse(validInputs);
    expect(result.success).toBe(true);
  });

  it('should reject negative purchase price', () => {
    const invalidInputs = {
      purchasePrice: -100,
      // ...
    };

    const result = RentalInputsSchema.safeParse(invalidInputs);
    expect(result.success).toBe(false);
  });
});
```

## CI Integration

Update `.github/workflows/ci.yml` to include tests:

```yaml
test-unit:
  name: Unit Tests
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    
    - uses: pnpm/action-setup@v3
      with:
        version: 9
    
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'
    
    - run: pnpm install --frozen-lockfile
    - run: pnpm test:unit
    
    - name: Upload coverage
      uses: codecov/codecov-action@v4
      with:
        files: ./apps/web/coverage/coverage-final.json
        fail_ci_if_error: false

test-e2e:
  name: E2E Tests
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    
    - uses: pnpm/action-setup@v3
      with:
        version: 9
    
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'
    
    - run: pnpm install --frozen-lockfile
    - run: pnpm exec playwright install --with-deps
    
    - name: Run E2E tests
      run: pnpm test:e2e
      env:
        TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
        TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
    
    - uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-report
        path: apps/web/playwright-report/
        retention-days: 7
```

## Package.json Scripts

Add to `apps/web/package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

## Summary

After setup, you should be able to run:

- `pnpm test` - Run all tests across the monorepo
- `pnpm test:unit` - Run unit/component tests
- `pnpm test:e2e` - Run Playwright E2E tests
- `pnpm test:coverage` - Generate coverage reports
- `pnpm test:watch` - Watch mode for development

The testing setup follows these best practices:

1. **Test isolation** - MSW resets between tests
2. **Custom render** - Wraps components with providers
3. **Factories** - Consistent test data creation
4. **E2E auth** - Persistent auth state for faster tests
5. **Coverage thresholds** - Enforced minimum coverage
6. **CI integration** - Automated testing in pipelines
```

---

## Additional Tips

### Test File Naming Conventions

- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.spec.ts`

### Coverage Goals (Suggested Minimums)

| Type | Coverage |
|------|----------|
| Calculation logic | 90%+ |
| API routes | 80%+ |
| Components | 70%+ |
| Utilities | 80%+ |

### Testing Priorities for DealForge

1. **Highest priority**: Calculation functions (these must be correct)
2. **High priority**: API routes and data validation
3. **Medium priority**: Form components and user flows
4. **Lower priority**: UI components (visual testing can supplement)
