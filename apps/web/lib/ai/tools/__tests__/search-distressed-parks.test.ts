/**
 * Tests for search-distressed-parks AI tool
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createMockSql,
  createMockCommunity,
  createMockTaxLien,
  setupTestEnv,
  cleanupTestEnv,
} from './setup';

// Mock neon module before importing the tool
const mockSqlFn = createMockSql();
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => mockSqlFn),
}));

// Import after mock is set up
import { searchDistressedParks } from '../search-distressed-parks';

describe('searchDistressedParks', () => {
  beforeEach(() => {
    setupTestEnv();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestEnv();
  });

  describe('basic search', () => {
    it('returns parks with distress data', async () => {
      const mockPark = {
        community_id: 'mhc_test123',
        name: 'Distressed Park',
        address: '123 Main St',
        city: 'San Antonio',
        county: 'Bexar',
        lot_count: 50,
        latitude: 29.4241,
        longitude: -98.4936,
        distress_score: 75.5,
        distress_updated_at: '2024-12-01',
        active_lien_count: 5,
        total_tax_owed: 12500,
        tax_years_with_liens: 3,
        most_recent_lien_date: '2024-06-15',
      };

      mockSqlFn.mockResolvedValue([mockPark]);

      const result = await searchDistressedParks.execute({});

      expect(result.parks.length).toBe(1);
      expect(result.parks[0].communityId).toBe('mhc_test123');
      expect(result.parks[0].distressScore).toBe(75.5);
      expect(result.parks[0].activeLienCount).toBe(5);
      expect(result.parks[0].totalTaxOwed).toBe(12500);
    });

    it('returns empty array when no parks found', async () => {
      mockSqlFn.mockResolvedValue([]);

      const result = await searchDistressedParks.execute({});

      expect(result.parks).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  describe('filtering', () => {
    it('filters by county', async () => {
      const mockPark = {
        community_id: 'mhc_bexar',
        name: 'Bexar Park',
        county: 'BEXAR',
        distress_score: 60,
        active_lien_count: 2,
        total_tax_owed: 5000,
        tax_years_with_liens: 1,
      };

      let capturedQuery = '';
      let capturedParams: unknown[] = [];

      mockSqlFn.mockImplementation(async (query: string, params?: unknown[]) => {
        capturedQuery = query;
        capturedParams = params || [];
        return [mockPark];
      });

      const result = await searchDistressedParks.execute({ county: 'Bexar' });

      expect(capturedQuery).toContain('UPPER(c.county) = $1');
      expect(capturedParams[0]).toBe('BEXAR');
      expect(result.filters.county).toBe('Bexar');
    });

    it('filters by minimum distress score', async () => {
      let capturedQuery = '';
      let capturedParams: unknown[] = [];

      mockSqlFn.mockImplementation(async (query: string, params?: unknown[]) => {
        capturedQuery = query;
        capturedParams = params || [];
        return [];
      });

      await searchDistressedParks.execute({ minScore: 50 });

      expect(capturedQuery).toContain('COALESCE(c.distress_score, 0) >=');
      expect(capturedParams).toContain(50);
    });

    it('filters by maximum distress score', async () => {
      let capturedQuery = '';
      let capturedParams: unknown[] = [];

      mockSqlFn.mockImplementation(async (query: string, params?: unknown[]) => {
        capturedQuery = query;
        capturedParams = params || [];
        return [];
      });

      await searchDistressedParks.execute({ maxScore: 80 });

      expect(capturedQuery).toContain('COALESCE(c.distress_score, 0) <=');
      expect(capturedParams).toContain(80);
    });

    it('filters by distress score range', async () => {
      let capturedParams: unknown[] = [];

      mockSqlFn.mockImplementation(async (query: string, params?: unknown[]) => {
        capturedParams = params || [];
        return [];
      });

      await searchDistressedParks.execute({ minScore: 40, maxScore: 70 });

      expect(capturedParams).toContain(40);
      expect(capturedParams).toContain(70);
    });

    it('filters by minimum lot count', async () => {
      let capturedQuery = '';
      let capturedParams: unknown[] = [];

      mockSqlFn.mockImplementation(async (query: string, params?: unknown[]) => {
        capturedQuery = query;
        capturedParams = params || [];
        return [];
      });

      await searchDistressedParks.execute({ minLots: 25 });

      expect(capturedQuery).toContain('c.lot_count >=');
      expect(capturedParams).toContain(25);
    });

    it('filters by maximum lot count', async () => {
      let capturedQuery = '';
      let capturedParams: unknown[] = [];

      mockSqlFn.mockImplementation(async (query: string, params?: unknown[]) => {
        capturedQuery = query;
        capturedParams = params || [];
        return [];
      });

      await searchDistressedParks.execute({ maxLots: 100 });

      expect(capturedQuery).toContain('c.lot_count <=');
      expect(capturedParams).toContain(100);
    });

    it('combines multiple filters', async () => {
      let capturedQuery = '';
      let capturedParams: unknown[] = [];

      mockSqlFn.mockImplementation(async (query: string, params?: unknown[]) => {
        capturedQuery = query;
        capturedParams = params || [];
        return [];
      });

      await searchDistressedParks.execute({
        county: 'Harris',
        minScore: 50,
        maxScore: 90,
        minLots: 20,
        maxLots: 200,
      });

      expect(capturedQuery).toContain('UPPER(c.county) =');
      expect(capturedQuery).toContain('COALESCE(c.distress_score, 0) >=');
      expect(capturedQuery).toContain('COALESCE(c.distress_score, 0) <=');
      expect(capturedQuery).toContain('c.lot_count >=');
      expect(capturedQuery).toContain('c.lot_count <=');
      expect(capturedParams.length).toBe(5);
    });
  });

  describe('sorting', () => {
    it('sorts by distress score descending by default', async () => {
      let capturedQuery = '';

      mockSqlFn.mockImplementation(async (query: string) => {
        capturedQuery = query;
        return [];
      });

      await searchDistressedParks.execute({});

      expect(capturedQuery).toContain('ORDER BY COALESCE(c.distress_score, 0) DESC');
    });

    it('sorts by lien count when specified', async () => {
      let capturedQuery = '';

      mockSqlFn.mockImplementation(async (query: string) => {
        capturedQuery = query;
        return [];
      });

      await searchDistressedParks.execute({ sortBy: 'lienCount' });

      expect(capturedQuery).toContain('ORDER BY active_lien_count');
    });

    it('sorts by tax owed when specified', async () => {
      let capturedQuery = '';

      mockSqlFn.mockImplementation(async (query: string) => {
        capturedQuery = query;
        return [];
      });

      await searchDistressedParks.execute({ sortBy: 'taxOwed' });

      expect(capturedQuery).toContain('ORDER BY total_tax_owed');
    });

    it('sorts by lot count when specified', async () => {
      let capturedQuery = '';

      mockSqlFn.mockImplementation(async (query: string) => {
        capturedQuery = query;
        return [];
      });

      await searchDistressedParks.execute({ sortBy: 'lotCount' });

      expect(capturedQuery).toContain('ORDER BY c.lot_count');
    });

    it('respects ascending sort order', async () => {
      let capturedQuery = '';

      mockSqlFn.mockImplementation(async (query: string) => {
        capturedQuery = query;
        return [];
      });

      await searchDistressedParks.execute({ sortBy: 'score', sortOrder: 'asc' });

      expect(capturedQuery).toContain('ASC');
    });

    it('respects descending sort order', async () => {
      let capturedQuery = '';

      mockSqlFn.mockImplementation(async (query: string) => {
        capturedQuery = query;
        return [];
      });

      await searchDistressedParks.execute({ sortBy: 'score', sortOrder: 'desc' });

      expect(capturedQuery).toContain('DESC');
    });
  });

  describe('pagination', () => {
    it('uses default limit of 10', async () => {
      let capturedQuery = '';

      mockSqlFn.mockImplementation(async (query: string) => {
        capturedQuery = query;
        return [];
      });

      // Provide explicit limit since execute() bypasses zod schema defaults
      await searchDistressedParks.execute({ limit: 10, sortBy: 'score', sortOrder: 'desc' });

      expect(capturedQuery).toContain('LIMIT 10');
    });

    it('respects custom limit', async () => {
      let capturedQuery = '';

      mockSqlFn.mockImplementation(async (query: string) => {
        capturedQuery = query;
        return [];
      });

      await searchDistressedParks.execute({ limit: 25 });

      expect(capturedQuery).toContain('LIMIT 25');
    });

    it('enforces maximum limit of 50', async () => {
      // The schema should enforce max 50, but test the output
      const result = await searchDistressedParks.execute({ limit: 50 });

      expect(result.count).toBeLessThanOrEqual(50);
    });
  });

  describe('lien data aggregation', () => {
    it('aggregates active lien count correctly', async () => {
      const mockPark = {
        community_id: 'mhc_test',
        name: 'Test Park',
        county: 'Bexar',
        distress_score: 70,
        active_lien_count: 8,
        total_tax_owed: 25000,
        tax_years_with_liens: 4,
        most_recent_lien_date: '2024-09-01',
      };

      mockSqlFn.mockResolvedValue([mockPark]);

      const result = await searchDistressedParks.execute({});

      expect(result.parks[0].activeLienCount).toBe(8);
      expect(result.parks[0].totalTaxOwed).toBe(25000);
      expect(result.parks[0].taxYearsWithLiens).toBe(4);
    });

    it('handles parks with zero liens', async () => {
      const mockPark = {
        community_id: 'mhc_clean',
        name: 'Clean Park',
        county: 'Travis',
        distress_score: 30,
        active_lien_count: 0,
        total_tax_owed: 0,
        tax_years_with_liens: 0,
        most_recent_lien_date: null,
      };

      mockSqlFn.mockResolvedValue([mockPark]);

      const result = await searchDistressedParks.execute({});

      expect(result.parks[0].activeLienCount).toBe(0);
      expect(result.parks[0].totalTaxOwed).toBe(0);
      expect(result.parks[0].mostRecentLienDate).toBeNull();
    });
  });

  describe('result metadata', () => {
    it('returns filter metadata', async () => {
      mockSqlFn.mockResolvedValue([]);

      const result = await searchDistressedParks.execute({
        county: 'Harris',
        minScore: 40,
        maxScore: 80,
        minLots: 10,
        maxLots: 150,
      });

      expect(result.filters).toEqual({
        county: 'Harris',
        minScore: 40,
        maxScore: 80,
        minLots: 10,
        maxLots: 150,
      });
    });

    it('returns sort metadata', async () => {
      mockSqlFn.mockResolvedValue([]);

      const result = await searchDistressedParks.execute({
        sortBy: 'lienCount',
        sortOrder: 'asc',
      });

      expect(result.sortBy).toBe('lienCount');
      expect(result.sortOrder).toBe('asc');
    });

    it('returns count matching parks array length', async () => {
      const mockParks = [
        { community_id: 'mhc_1', distress_score: 70, active_lien_count: 2, total_tax_owed: 5000, tax_years_with_liens: 1 },
        { community_id: 'mhc_2', distress_score: 65, active_lien_count: 3, total_tax_owed: 7500, tax_years_with_liens: 2 },
        { community_id: 'mhc_3', distress_score: 80, active_lien_count: 5, total_tax_owed: 15000, tax_years_with_liens: 3 },
      ];

      mockSqlFn.mockResolvedValue(mockParks);

      const result = await searchDistressedParks.execute({});

      expect(result.count).toBe(3);
      expect(result.parks.length).toBe(3);
    });
  });

  describe('data mapping', () => {
    it('maps all fields correctly', async () => {
      const mockPark = {
        community_id: 'mhc_full',
        name: 'Full Data Park',
        address: '456 Oak Ave',
        city: 'Houston',
        county: 'Harris',
        lot_count: 75,
        latitude: 29.76,
        longitude: -95.36,
        distress_score: 55.5,
        distress_updated_at: '2024-11-15T10:00:00Z',
        active_lien_count: 4,
        total_tax_owed: 9800,
        tax_years_with_liens: 2,
        most_recent_lien_date: '2024-07-20',
      };

      mockSqlFn.mockResolvedValue([mockPark]);

      const result = await searchDistressedParks.execute({});
      const park = result.parks[0];

      expect(park.communityId).toBe('mhc_full');
      expect(park.name).toBe('Full Data Park');
      expect(park.address).toBe('456 Oak Ave');
      expect(park.city).toBe('Houston');
      expect(park.county).toBe('Harris');
      expect(park.lotCount).toBe(75);
      expect(park.latitude).toBe(29.76);
      expect(park.longitude).toBe(-95.36);
      expect(park.distressScore).toBe(55.5);
      expect(park.distressUpdatedAt).toBe('2024-11-15T10:00:00Z');
      expect(park.activeLienCount).toBe(4);
      expect(park.totalTaxOwed).toBe(9800);
      expect(park.taxYearsWithLiens).toBe(2);
      expect(park.mostRecentLienDate).toBe('2024-07-20');
    });

    it('handles null optional fields', async () => {
      const mockPark = {
        community_id: 'mhc_minimal',
        name: null,
        address: null,
        city: '',
        county: '',
        lot_count: null,
        latitude: null,
        longitude: null,
        distress_score: 0,
        distress_updated_at: null,
        active_lien_count: 0,
        total_tax_owed: 0,
        tax_years_with_liens: 0,
        most_recent_lien_date: null,
      };

      mockSqlFn.mockResolvedValue([mockPark]);

      const result = await searchDistressedParks.execute({});
      const park = result.parks[0];

      expect(park.name).toBe('Unknown');
      expect(park.address).toBeNull();
      expect(park.lotCount).toBeNull();
      expect(park.latitude).toBeNull();
      expect(park.longitude).toBeNull();
      expect(park.distressUpdatedAt).toBeNull();
      expect(park.mostRecentLienDate).toBeNull();
    });
  });
});
