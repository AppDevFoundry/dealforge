import { MH_PARK_DEFAULTS } from '@/lib/constants/mh-park-defaults';
import { RENTAL_DEFAULTS } from '@/lib/constants/rental-defaults';
import type {
  MhCommunity,
  MhParkCalculatorInputs,
  MhParkCalculatorResults,
  RentalInputs,
  RentalResults,
} from '@dealforge/types';

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
// MH Park Inputs Factory
// ============================================
export function createMockMhParkInputs(
  overrides: Partial<MhParkCalculatorInputs> = {}
): MhParkCalculatorInputs {
  return {
    ...MH_PARK_DEFAULTS,
    ...overrides,
  };
}

// ============================================
// MH Park Results Factory
// ============================================
export function createMockMhParkResults(
  overrides: Partial<MhParkCalculatorResults> = {}
): MhParkCalculatorResults {
  return {
    // Occupancy
    occupancyRate: 90.67,

    // Income Analysis
    grossPotentialRent: 405000,
    effectiveGrossIncome: 373200,
    vacancyLoss: 37800,
    otherIncomeAnnual: 6000,

    // Expense Analysis
    totalOperatingExpenses: 130620,

    // Net Operating Income
    netOperatingIncome: 242580,
    noiPerLot: 3234.4,

    // Financing
    loanAmount: 1875000,
    downPayment: 625000,
    closingCosts: 50000,
    totalInvestment: 675000,
    monthlyDebtService: 14538.12,
    annualDebtService: 174457.44,

    // Key Metrics
    capRate: 9.7,
    cashOnCashReturn: 10.09,
    debtServiceCoverageRatio: 1.39,

    // Cash Flow
    monthlyCashFlow: 5676.88,
    annualCashFlow: 68122.56,

    // Valuation
    pricePerLot: 33333.33,
    estimatedMarketValue: 3032250,
    grossRentMultiplier: 6.17,
    ...overrides,
  };
}

// ============================================
// MH Community Factory
// ============================================
let communityIdCounter = 0;

export function createMockMhCommunity(overrides: Partial<MhCommunity> = {}): MhCommunity {
  communityIdCounter++;
  return {
    id: `mhc_${communityIdCounter}`,
    name: `Test MH Park ${communityIdCounter}`,
    address: `${100 + communityIdCounter} Park Road`,
    city: 'San Antonio',
    county: 'Bexar',
    state: 'TX',
    zipCode: '78201',
    latitude: 29.4241 + communityIdCounter * 0.01,
    longitude: -98.4936 + communityIdCounter * 0.01,
    lotCount: 75,
    estimatedOccupancy: 0.9,
    propertyType: 'all_ages',
    ownerName: `Test Owner ${communityIdCounter}`,
    source: 'manual',
    sourceUpdatedAt: new Date(),
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ============================================
// Tax Lien Factory
// ============================================
export interface MockTaxLien {
  id: string;
  serialNumber: string | null;
  hudLabel: string | null;
  county: string;
  taxingEntity: string | null;
  amount: number | null;
  year: number | null;
  status: 'active' | 'released';
  filedDate: Date | null;
  releasedDate: Date | null;
  communityId: string | null;
  sourceUpdatedAt: Date | null;
  createdAt: Date;
  community?: {
    id: string;
    name: string;
    city: string;
  } | null;
}

let taxLienIdCounter = 0;

export function createMockTaxLien(overrides: Partial<MockTaxLien> = {}): MockTaxLien {
  taxLienIdCounter++;
  return {
    id: `mtl_${taxLienIdCounter}`,
    serialNumber: `TEX${100000 + taxLienIdCounter}A`,
    hudLabel: `TEX99${1000 + taxLienIdCounter}`,
    county: 'Bexar',
    taxingEntity: 'City of San Antonio',
    amount: 1500 + taxLienIdCounter * 100,
    year: 2024,
    status: 'active',
    filedDate: new Date('2024-03-15'),
    releasedDate: null,
    communityId: null,
    sourceUpdatedAt: new Date(),
    createdAt: new Date(),
    community: null,
    ...overrides,
  };
}

// ============================================
// Tax Lien Stats Factory
// ============================================
export interface MockTaxLienStats {
  totalActive: number;
  totalReleased: number;
  totalAmount: number;
  avgAmount: number;
  byCounty: { county: string; count: number; amount: number }[];
  byYear: { year: number; count: number }[];
}

export function createMockTaxLienStats(
  overrides: Partial<MockTaxLienStats> = {}
): MockTaxLienStats {
  return {
    totalActive: 88,
    totalReleased: 98,
    totalAmount: 132000,
    avgAmount: 1500,
    byCounty: [
      { county: 'Bexar', count: 25, amount: 37500 },
      { county: 'Hidalgo', count: 20, amount: 30000 },
      { county: 'Travis', count: 18, amount: 27000 },
      { county: 'Cameron', count: 15, amount: 22500 },
      { county: 'Nueces', count: 10, amount: 15000 },
    ],
    byYear: [
      { year: 2024, count: 45 },
      { year: 2023, count: 30 },
      { year: 2022, count: 13 },
    ],
    ...overrides,
  };
}

// ============================================
// Reset counters (useful for test isolation)
// ============================================
export function resetFactoryCounters() {
  userIdCounter = 0;
  sessionIdCounter = 0;
  communityIdCounter = 0;
  taxLienIdCounter = 0;
}
