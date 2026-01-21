import { MH_PARK_DEFAULTS } from '@/lib/constants/mh-park-defaults';
import { RENTAL_DEFAULTS } from '@/lib/constants/rental-defaults';
import type { MhParkInputs, MhParkResults, RentalInputs, RentalResults } from '@dealforge/types';

// ============================================
// User Factory
// ============================================
export interface MockUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

let userIdCounter = 0;

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  userIdCounter++;
  return {
    id: `user_${userIdCounter}`,
    email: `test${userIdCounter}@example.com`,
    name: `Test User ${userIdCounter}`,
    image: undefined,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ============================================
// Session Factory
// ============================================
export interface MockSession {
  user: MockUser;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

let sessionIdCounter = 0;

export function createMockSession(
  user?: MockUser,
  overrides: Partial<MockSession['session']> = {}
): MockSession {
  sessionIdCounter++;
  const mockUser = user || createMockUser();
  return {
    user: mockUser,
    session: {
      id: `session_${sessionIdCounter}`,
      userId: mockUser.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      token: `token_${sessionIdCounter}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    },
  };
}

// ============================================
// Rental Inputs Factory
// ============================================
export function createMockRentalInputs(overrides: Partial<RentalInputs> = {}): RentalInputs {
  return {
    ...RENTAL_DEFAULTS,
    ...overrides,
  };
}

// ============================================
// Rental Results Factory
// ============================================
export function createMockRentalResults(overrides: Partial<RentalResults> = {}): RentalResults {
  return {
    // Key metrics
    cashOnCashReturn: 8.5,
    capRate: 6.2,
    totalRoi: 12.3,
    monthlyCashFlow: 350,
    annualCashFlow: 4200,

    // Detailed breakdown
    totalInvestment: 44000,
    loanAmount: 160000,
    monthlyMortgage: 1064,
    grossMonthlyIncome: 1800,
    effectiveGrossIncome: 1710,
    totalMonthlyExpenses: 296,
    netOperatingIncome: 16968,
    debtServiceCoverageRatio: 1.33,

    // Amortization
    year1PrincipalPaydown: 2450,
    year1InterestPaid: 10318,

    // Projections
    fiveYearEquity: 56000,
    fiveYearTotalReturn: 52.7,
    ...overrides,
  };
}

// ============================================
// MH Park Inputs Factory
// ============================================
export function createMockMhParkInputs(overrides: Partial<MhParkInputs> = {}): MhParkInputs {
  return {
    ...MH_PARK_DEFAULTS,
    ...overrides,
  };
}

// ============================================
// MH Park Results Factory
// ============================================
export function createMockMhParkResults(overrides: Partial<MhParkResults> = {}): MhParkResults {
  return {
    grossPotentialIncome: 210000,
    vacancyLoss: 31500,
    effectiveGrossIncome: 178500,
    totalOperatingExpenses: 62475,
    netOperatingIncome: 116025,
    capRate: 7.74,
    monthlyCashFlow: 1753.25,
    annualCashFlow: 21039,
    cashOnCashReturn: 5.61,
    loanAmount: 1125000,
    monthlyDebtService: 7914.75,
    annualDebtService: 94977,
    totalInvestment: 375000,
    debtServiceCoverageRatio: 1.22,
    noiPerLot: 2320.5,
    pricePerLot: 30000,
    ...overrides,
  };
}

// ============================================
// API Response Factory
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export function createApiResponse<T>(data: T, success = true): ApiResponse<T> {
  return {
    success,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  };
}

// ============================================
// Error Response Factory
// ============================================
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export function createApiErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  };
}

// ============================================
// Reset counters (useful for test isolation)
// ============================================
export function resetFactoryCounters() {
  userIdCounter = 0;
  sessionIdCounter = 0;
}
