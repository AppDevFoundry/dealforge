/**
 * Tests for get-market-context AI tool
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createMockSql,
  createMockFMR,
  createMockCensus,
  createMockBLS,
  setupTestEnv,
  cleanupTestEnv,
} from './setup';

// Mock neon module before importing the tool
const mockSqlFn = createMockSql();
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => mockSqlFn),
}));

// Import after mock is set up
import { getMarketContext, type MarketContextResult } from '../get-market-context';

describe('getMarketContext', () => {
  beforeEach(() => {
    setupTestEnv();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestEnv();
  });

  describe('input validation', () => {
    it('throws error when neither zipCode nor county is provided', async () => {
      await expect(
        getMarketContext.execute({})
      ).rejects.toThrow('Either zipCode or county must be provided');
    });
  });

  describe('FMR data retrieval', () => {
    it('returns FMR data for valid county', async () => {
      const mockFMR = createMockFMR({
        two_bedroom: 1200,
        county_name: 'Bexar County',
      });

      mockSqlFn.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('hud_fair_market_rents')) {
          return [mockFMR];
        }
        return [];
      });

      const result = await getMarketContext.execute({ county: 'Bexar' });

      expect(result.fairMarketRents).toBeDefined();
      expect(result.fairMarketRents?.twoBedroom).toBe(1200);
      expect(result.fairMarketRents?.suggestedLotRent.low).toBe(360); // 30% of 1200
      expect(result.fairMarketRents?.suggestedLotRent.high).toBe(480); // 40% of 1200
    });

    it('calculates suggested lot rent from 2BR FMR', async () => {
      const mockFMR = createMockFMR({ two_bedroom: 1500 });

      mockSqlFn.mockResolvedValue([mockFMR]);

      const result = await getMarketContext.execute({ county: 'Harris' });

      expect(result.fairMarketRents?.suggestedLotRent.low).toBe(450); // 30% of 1500
      expect(result.fairMarketRents?.suggestedLotRent.high).toBe(600); // 40% of 1500
    });
  });

  describe('Census demographics retrieval', () => {
    it('returns Census demographics for county', async () => {
      const mockFMR = createMockFMR();
      const mockCensus = createMockCensus({
        total_population: 2000000,
        median_household_income: 65000,
        poverty_rate: 12.5,
        vacancy_rate: 8.5,
        mobile_homes_percent: 7.2,
      });

      mockSqlFn.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('hud_fair_market_rents')) {
          return [mockFMR];
        }
        if (query.includes('census_demographics')) {
          return [mockCensus];
        }
        return [];
      });

      const result = await getMarketContext.execute({ county: 'Bexar' });

      expect(result.demographics).toBeDefined();
      expect(result.demographics?.population).toBe(2000000);
      expect(result.demographics?.medianHouseholdIncome).toBe(65000);
      expect(result.demographics?.povertyRate).toBe(12.5);
      expect(result.demographics?.mobileHomesPercent).toBe(7.2);
    });
  });

  describe('BLS employment retrieval', () => {
    it('returns BLS employment data for county', async () => {
      const mockFMR = createMockFMR();
      const mockBLS = createMockBLS({
        year: 2024,
        month: 11,
        labor_force: 1000000,
        employed: 950000,
        unemployed: 50000,
        unemployment_rate: 5.0,
      });

      mockSqlFn.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('hud_fair_market_rents')) {
          return [mockFMR];
        }
        if (query.includes('bls_employment')) {
          return [mockBLS];
        }
        return [];
      });

      const result = await getMarketContext.execute({ county: 'Bexar' });

      expect(result.employment).toBeDefined();
      expect(result.employment?.laborForce).toBe(1000000);
      expect(result.employment?.unemploymentRate).toBe(5.0);
      expect(result.employment?.latestMonth).toBe('Nov 2024');
    });

    it('includes historical data when requested', async () => {
      const mockFMR = createMockFMR();
      const historicalData = [
        createMockBLS({ year: 2024, month: 12, unemployment_rate: 4.8 }),
        createMockBLS({ year: 2024, month: 11, unemployment_rate: 5.0 }),
        createMockBLS({ year: 2024, month: 10, unemployment_rate: 5.2 }),
        createMockBLS({ year: 2024, month: 9, unemployment_rate: 5.1 }),
      ];

      mockSqlFn.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('hud_fair_market_rents')) {
          return [mockFMR];
        }
        if (query.includes('bls_employment')) {
          return historicalData;
        }
        return [];
      });

      const result = await getMarketContext.execute({
        county: 'Bexar',
        includeHistorical: true,
      });

      expect(result.employment?.historical).toBeDefined();
      expect(result.employment?.historical?.length).toBeGreaterThan(0);
    });
  });

  describe('insights generation', () => {
    it('generates FMR-based insights', async () => {
      const mockFMR = createMockFMR({ two_bedroom: 1200 });

      mockSqlFn.mockResolvedValue([mockFMR]);

      const result = await getMarketContext.execute({ county: 'Bexar' });

      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.insights.some(i => i.includes('FMR'))).toBe(true);
    });

    it('generates affordability insights based on income', async () => {
      const mockFMR = createMockFMR();
      const mockCensus = createMockCensus({
        median_household_income: 60000,
      });

      mockSqlFn.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('hud_fair_market_rents')) {
          return [mockFMR];
        }
        if (query.includes('census_demographics')) {
          return [mockCensus];
        }
        return [];
      });

      const result = await getMarketContext.execute({ county: 'Bexar' });

      expect(result.insights.some(i => i.includes('Median household income'))).toBe(true);
    });

    it('generates high vacancy warning', async () => {
      const mockFMR = createMockFMR();
      const mockCensus = createMockCensus({
        vacancy_rate: 15.0, // High vacancy
      });

      mockSqlFn.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('hud_fair_market_rents')) {
          return [mockFMR];
        }
        if (query.includes('census_demographics')) {
          return [mockCensus];
        }
        return [];
      });

      const result = await getMarketContext.execute({ county: 'Bexar' });

      expect(result.insights.some(i => i.includes('High vacancy'))).toBe(true);
    });

    it('generates tight market insight for low vacancy', async () => {
      const mockFMR = createMockFMR();
      const mockCensus = createMockCensus({
        vacancy_rate: 3.5, // Low vacancy
      });

      mockSqlFn.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('hud_fair_market_rents')) {
          return [mockFMR];
        }
        if (query.includes('census_demographics')) {
          return [mockCensus];
        }
        return [];
      });

      const result = await getMarketContext.execute({ county: 'Bexar' });

      expect(result.insights.some(i => i.includes('Tight housing market'))).toBe(true);
    });

    it('generates MH presence insight when significant', async () => {
      const mockFMR = createMockFMR();
      const mockCensus = createMockCensus({
        mobile_homes_percent: 8.5,
        mobile_homes_count: 40000,
      });

      mockSqlFn.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('hud_fair_market_rents')) {
          return [mockFMR];
        }
        if (query.includes('census_demographics')) {
          return [mockCensus];
        }
        return [];
      });

      const result = await getMarketContext.execute({ county: 'Bexar' });

      expect(result.insights.some(i => i.includes('Strong MH presence'))).toBe(true);
    });

    it('generates unemployment insight for high rates', async () => {
      const mockFMR = createMockFMR();
      const mockBLS = createMockBLS({
        unemployment_rate: 7.5, // Above average
      });

      mockSqlFn.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('hud_fair_market_rents')) {
          return [mockFMR];
        }
        if (query.includes('bls_employment')) {
          return [mockBLS];
        }
        return [];
      });

      const result = await getMarketContext.execute({ county: 'Bexar' });

      expect(result.insights.some(i => i.includes('Above-average unemployment'))).toBe(true);
    });

    it('generates strong labor market insight for low unemployment', async () => {
      const mockFMR = createMockFMR();
      const mockBLS = createMockBLS({
        unemployment_rate: 3.2, // Low
      });

      mockSqlFn.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('hud_fair_market_rents')) {
          return [mockFMR];
        }
        if (query.includes('bls_employment')) {
          return [mockBLS];
        }
        return [];
      });

      const result = await getMarketContext.execute({ county: 'Bexar' });

      expect(result.insights.some(i => i.includes('Strong labor market'))).toBe(true);
    });
  });

  describe('handles missing data gracefully', () => {
    it('returns partial result when FMR data is missing', async () => {
      mockSqlFn.mockResolvedValue([]);

      const result = await getMarketContext.execute({ county: 'Unknown' });

      expect(result.fairMarketRents).toBeUndefined();
      // County is stored as-is from input, uppercased
      expect(result.location.county.toUpperCase()).toBe('UNKNOWN');
    });

    it('returns partial result when Census data is missing', async () => {
      const mockFMR = createMockFMR();

      mockSqlFn.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('hud_fair_market_rents')) {
          return [mockFMR];
        }
        return [];
      });

      const result = await getMarketContext.execute({ county: 'Bexar' });

      expect(result.fairMarketRents).toBeDefined();
      expect(result.demographics).toBeUndefined();
    });

    it('returns partial result when BLS data is missing', async () => {
      const mockFMR = createMockFMR();
      const mockCensus = createMockCensus();

      mockSqlFn.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('hud_fair_market_rents')) {
          return [mockFMR];
        }
        if (query.includes('census_demographics')) {
          return [mockCensus];
        }
        return [];
      });

      const result = await getMarketContext.execute({ county: 'Bexar' });

      expect(result.fairMarketRents).toBeDefined();
      expect(result.demographics).toBeDefined();
      expect(result.employment).toBeUndefined();
    });
  });

  describe('location resolution', () => {
    it('resolves county from ZIP code when county not provided', async () => {
      const mockFMR = createMockFMR({
        county_name: 'Hidalgo County',
        zip_code: '78501',
      });

      mockSqlFn.mockResolvedValue([mockFMR]);

      const result = await getMarketContext.execute({ zipCode: '78501' });

      expect(result.location.county).toBe('HIDALGO COUNTY');
    });

    it('sets metro name when available in FMR data', async () => {
      const mockFMR = createMockFMR({
        metro_name: 'San Antonio-New Braunfels',
      });

      mockSqlFn.mockResolvedValue([mockFMR]);

      const result = await getMarketContext.execute({ county: 'Bexar' });

      expect(result.location.metro).toBe('San Antonio-New Braunfels');
    });
  });
});
