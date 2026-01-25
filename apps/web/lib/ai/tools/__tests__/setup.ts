/**
 * Test setup and mock factories for AI tool tests
 */

import { vi } from 'vitest';

// Type for mock SQL function
type MockSqlRow = Record<string, unknown>;
type MockSqlFn = {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<MockSqlRow[]>;
  (query: string, params?: unknown[]): Promise<MockSqlRow[]>;
};

/**
 * Creates a mock SQL function for testing
 */
export function createMockSql(responses: Record<string, MockSqlRow[]> = {}): MockSqlFn {
  const mockFn = vi.fn(async (...args: unknown[]): Promise<MockSqlRow[]> => {
    // Handle tagged template literal call
    if (Array.isArray(args[0]) && 'raw' in (args[0] as object)) {
      const strings = args[0] as TemplateStringsArray;
      const query = strings.join('?');

      // Match based on query content
      for (const [pattern, response] of Object.entries(responses)) {
        if (query.toLowerCase().includes(pattern.toLowerCase())) {
          return response;
        }
      }
      return [];
    }

    // Handle string query call
    if (typeof args[0] === 'string') {
      const query = args[0];
      for (const [pattern, response] of Object.entries(responses)) {
        if (query.toLowerCase().includes(pattern.toLowerCase())) {
          return response;
        }
      }
      return [];
    }

    return [];
  });

  return mockFn as unknown as MockSqlFn;
}

/**
 * Mock neon module factory
 */
export function createMockNeon(sqlFn: MockSqlFn) {
  return {
    neon: vi.fn(() => sqlFn),
  };
}

// ============================================
// Mock Data Factories
// ============================================

/**
 * Creates mock HUD FMR data
 */
export function createMockFMR(overrides: Partial<MockSqlRow> = {}): MockSqlRow {
  return {
    id: 'hfr_test123',
    fiscal_year: 2025,
    efficiency: 850,
    one_bedroom: 1000,
    two_bedroom: 1200,
    three_bedroom: 1600,
    four_bedroom: 2000,
    county_name: 'Bexar County',
    metro_name: 'San Antonio-New Braunfels',
    state_name: 'Texas',
    state_code: 'TX',
    entity_code: 'COUNTY48029',
    zip_code: null,
    small_area_status: '0',
    ...overrides,
  };
}

/**
 * Creates mock Census demographics data
 */
export function createMockCensus(overrides: Partial<MockSqlRow> = {}): MockSqlRow {
  return {
    id: 'cen_test123',
    geo_id: '48029',
    geo_type: 'county',
    geo_name: 'Bexar County, Texas',
    state_code: '48',
    county_code: '029',
    survey_year: 2023,
    total_population: 2009324,
    median_age: 34.5,
    median_household_income: 62456,
    per_capita_income: 32145,
    poverty_rate: 12.8,
    total_housing_units: 800000,
    occupied_housing_units: 720000,
    vacancy_rate: 10.0,
    owner_occupied_rate: 55.6,
    renter_occupied_rate: 44.4,
    median_home_value: 225000,
    median_gross_rent: 1100,
    mobile_homes_count: 50000,
    mobile_homes_percent: 6.25,
    high_school_grad_rate: 85.5,
    bachelors_degree_rate: 28.0,
    ...overrides,
  };
}

/**
 * Creates mock BLS employment data
 */
export function createMockBLS(overrides: Partial<MockSqlRow> = {}): MockSqlRow {
  return {
    id: 'bls_test123',
    area_code: 'CN4802900000000',
    area_name: 'Bexar County, TX',
    area_type: 'county',
    state_code: '48',
    county_code: '029',
    year: 2024,
    month: 12,
    period_type: 'monthly',
    labor_force: 1050000,
    employed: 1000000,
    unemployed: 50000,
    unemployment_rate: 4.8,
    is_preliminary: 'N',
    ...overrides,
  };
}

/**
 * Creates mock MH Community data
 */
export function createMockCommunity(overrides: Partial<MockSqlRow> = {}): MockSqlRow {
  return {
    id: 'mhc_test123',
    community_id: 'mhc_test123',
    name: 'Test Mobile Home Park',
    address: '123 Main St',
    city: 'San Antonio',
    county: 'Bexar',
    state: 'TX',
    zip_code: '78201',
    latitude: 29.4241,
    longitude: -98.4936,
    lot_count: 50,
    estimated_occupancy: 0.85,
    distress_score: 65.5,
    distress_updated_at: '2024-12-15T00:00:00Z',
    property_type: 'all_ages',
    owner_name: 'ABC Properties LLC',
    source: 'tdhca_clustering',
    ...overrides,
  };
}

/**
 * Creates mock MH Tax Lien data
 */
export function createMockTaxLien(overrides: Partial<MockSqlRow> = {}): MockSqlRow {
  return {
    id: 'mhl_test123',
    tax_roll_number: '2024-00001',
    payer_name: 'ABC Properties LLC',
    payer_address: '123 Main St',
    payer_city: 'San Antonio',
    label: 'TXS123456',
    serial_number: 'SN123456789',
    county: 'BEXAR',
    tax_unit_id: 'TU001',
    tax_unit_name: 'Bexar County',
    tax_year: 2023,
    lien_date: '2024-03-15',
    release_date: null,
    tax_amount: 2500.0,
    status: 'active',
    ...overrides,
  };
}

/**
 * Creates mock CCN area data
 */
export function createMockCCNArea(overrides: Partial<MockSqlRow> = {}): MockSqlRow {
  return {
    id: 'ccn_test123',
    ccn_number: 'CCN-001',
    utility_name: 'San Antonio Water System',
    service_type: 'water',
    county: 'Bexar',
    ...overrides,
  };
}

// ============================================
// Test Helpers
// ============================================

/**
 * Sets up environment variables for tests
 */
export function setupTestEnv() {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.MAPBOX_ACCESS_TOKEN = 'pk.test_token';
}

/**
 * Cleans up environment variables after tests
 */
export function cleanupTestEnv() {
  delete process.env.DATABASE_URL;
  delete process.env.MAPBOX_ACCESS_TOKEN;
}
