/**
 * Tests for lookup-parcel-data AI tool
 */

import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../../__tests__/utils/msw/server';
import {
  cleanupTestEnv,
  createMockCCNArea,
  createMockCommunity,
  createMockFMR,
  createMockSql,
  setupTestEnv,
} from './setup';

// Mock neon module before importing the tool
const mockSqlFn = createMockSql();
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => mockSqlFn),
}));

// Import after mock is set up
import { lookupParcelData } from '../lookup-parcel-data';

describe('lookupParcelData', () => {
  beforeEach(() => {
    setupTestEnv();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestEnv();
    server.resetHandlers();
  });

  describe('geocoding', () => {
    it('geocodes address via Mapbox when provided', async () => {
      // Add MSW handler for Mapbox geocoding
      server.use(
        http.get('https://api.mapbox.com/geocoding/v5/mapbox.places/*', () => {
          return HttpResponse.json({
            features: [
              {
                center: [-98.4936, 29.4241],
                place_name: '123 Main St, San Antonio, TX 78201',
                context: [
                  { id: 'postcode.123', text: '78201' },
                  { id: 'place.456', text: 'San Antonio' },
                  { id: 'district.789', text: 'Bexar County' },
                ],
              },
            ],
          });
        })
      );

      // Mock empty DB responses
      mockSqlFn.mockImplementation(async () => []);

      const result = await lookupParcelData.execute({
        address: '123 Main St, San Antonio, TX',
      });

      expect(result.location.coordinates).toEqual({
        latitude: 29.4241,
        longitude: -98.4936,
      });
      expect(result.location.zipCode).toBe('78201');
      expect(result.location.city).toBe('San Antonio');
      expect(result.location.county).toBe('Bexar');
    });

    it('uses provided coordinates when available', async () => {
      mockSqlFn.mockImplementation(async () => []);

      const result = await lookupParcelData.execute({
        latitude: 29.5,
        longitude: -98.5,
        zipCode: '78201',
      });

      expect(result.location.coordinates).toEqual({
        latitude: 29.5,
        longitude: -98.5,
      });
    });

    it('handles geocoding failure gracefully', async () => {
      server.use(
        http.get('https://api.mapbox.com/geocoding/v5/mapbox.places/*', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      mockSqlFn.mockImplementation(async () => []);

      const result = await lookupParcelData.execute({
        address: 'Invalid Address',
      });

      expect(result.location.coordinates).toBeUndefined();
    });

    it('handles no geocoding results gracefully', async () => {
      server.use(
        http.get('https://api.mapbox.com/geocoding/v5/mapbox.places/*', () => {
          return HttpResponse.json({ features: [] });
        })
      );

      mockSqlFn.mockImplementation(async () => []);

      const result = await lookupParcelData.execute({
        address: 'Unknown Place',
      });

      expect(result.location.coordinates).toBeUndefined();
    });
  });

  describe('CCN utility coverage', () => {
    it('detects water coverage', async () => {
      const mockWaterCCN = createMockCCNArea({
        utility_name: 'San Antonio Water System',
        service_type: 'water',
      });

      mockSqlFn.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes("service_type IN ('water', 'both')")) {
          return [mockWaterCCN];
        }
        return [];
      });

      const result = await lookupParcelData.execute({
        latitude: 29.4241,
        longitude: -98.4936,
      });

      expect(result.utilities.hasWater).toBe(true);
      expect(result.utilities.waterProvider).toBe('San Antonio Water System');
    });

    it('detects sewer coverage', async () => {
      const mockSewerCCN = createMockCCNArea({
        utility_name: 'SAWS Sewer',
        service_type: 'sewer',
      });

      mockSqlFn.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes("service_type IN ('sewer', 'both')")) {
          return [mockSewerCCN];
        }
        return [];
      });

      const result = await lookupParcelData.execute({
        latitude: 29.4241,
        longitude: -98.4936,
      });

      expect(result.utilities.hasSewer).toBe(true);
      expect(result.utilities.sewerProvider).toBe('SAWS Sewer');
    });

    it('detects no coverage and generates insight', async () => {
      mockSqlFn.mockResolvedValue([]);

      const result = await lookupParcelData.execute({
        latitude: 29.4241,
        longitude: -98.4936,
      });

      expect(result.utilities.hasWater).toBe(false);
      expect(result.utilities.hasSewer).toBe(false);
      expect(result.insights.some((i) => i.includes('No CCN utility coverage'))).toBe(true);
    });

    it('generates full coverage insight', async () => {
      const mockWaterCCN = createMockCCNArea({
        utility_name: 'SAWS',
        service_type: 'water',
      });
      const mockSewerCCN = createMockCCNArea({
        utility_name: 'SAWS',
        service_type: 'sewer',
      });

      mockSqlFn.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes("service_type IN ('water', 'both')")) {
          return [mockWaterCCN];
        }
        if (query.includes("service_type IN ('sewer', 'both')")) {
          return [mockSewerCCN];
        }
        return [];
      });

      const result = await lookupParcelData.execute({
        latitude: 29.4241,
        longitude: -98.4936,
      });

      expect(result.utilities.hasWater).toBe(true);
      expect(result.utilities.hasSewer).toBe(true);
      expect(result.insights.some((i) => i.includes('Full utility coverage'))).toBe(true);
    });
  });

  describe('FMR market rents', () => {
    it('returns FMR-based rent estimates for ZIP code', async () => {
      const mockFMR = createMockFMR({
        fiscal_year: 2025,
        two_bedroom: 1400,
      });

      mockSqlFn.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('hud_fair_market_rents')) {
          return [mockFMR];
        }
        return [];
      });

      const result = await lookupParcelData.execute({
        zipCode: '78201',
      });

      expect(result.marketRents).toBeDefined();
      expect(result.marketRents?.twoBedroom).toBe(1400);
      expect(result.marketRents?.suggestedLotRent.low).toBe(420); // 30% of 1400
      expect(result.marketRents?.suggestedLotRent.high).toBe(560); // 40% of 1400
    });
  });

  describe('nearby parks', () => {
    it('finds nearby MH parks within radius', async () => {
      const mockPark1 = {
        ...createMockCommunity(),
        distance_miles: 2.5,
      };
      const mockPark2 = {
        ...createMockCommunity({
          id: 'mhc_test456',
          name: 'Another Park',
        }),
        distance_miles: 5.0,
      };

      mockSqlFn.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('ST_DWithin')) {
          return [mockPark1, mockPark2];
        }
        return [];
      });

      const result = await lookupParcelData.execute({
        latitude: 29.4241,
        longitude: -98.4936,
        searchRadiusMiles: 10,
      });

      expect(result.nearbyParks.length).toBe(2);
      expect(result.nearbyParks[0].distanceMiles).toBe(2.5);
      expect(result.insights.some((i) => i.includes('Found 2 MH parks'))).toBe(true);
    });

    it('generates insight when distressed parks found nearby', async () => {
      const mockDistressedPark = {
        ...createMockCommunity({
          distress_score: 75,
        }),
        distance_miles: 3.0,
      };

      mockSqlFn.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('ST_DWithin')) {
          return [mockDistressedPark];
        }
        return [];
      });

      const result = await lookupParcelData.execute({
        latitude: 29.4241,
        longitude: -98.4936,
      });

      expect(result.insights.some((i) => i.includes('distress signals'))).toBe(true);
    });

    it('generates insight when no parks found', async () => {
      mockSqlFn.mockResolvedValue([]);

      const result = await lookupParcelData.execute({
        latitude: 29.4241,
        longitude: -98.4936,
      });

      expect(result.nearbyParks.length).toBe(0);
      expect(result.insights.some((i) => i.includes('No MH parks found'))).toBe(true);
    });

    it('respects custom search radius', async () => {
      let capturedRadius: number | undefined;

      mockSqlFn.mockImplementation(async (strings: TemplateStringsArray, ...values: unknown[]) => {
        const query = strings.join('');
        if (query.includes('ST_DWithin')) {
          // The query interpolates: lng, lat (for ST_Distance), lng, lat (for ST_DWithin), radiusMeters
          // So radiusMeters is at index 4
          capturedRadius = values[4] as number;
        }
        return [];
      });

      await lookupParcelData.execute({
        latitude: 29.4241,
        longitude: -98.4936,
        searchRadiusMiles: 25,
      });

      // 25 miles * 1609.34 meters/mile
      expect(capturedRadius).toBeCloseTo(25 * 1609.34, 0);
    });
  });

  describe('integration', () => {
    it('returns complete result with all data sources', async () => {
      // Add MSW handler for Mapbox geocoding
      server.use(
        http.get('https://api.mapbox.com/geocoding/v5/mapbox.places/*', () => {
          return HttpResponse.json({
            features: [
              {
                center: [-98.4936, 29.4241],
                place_name: '123 Main St, San Antonio, TX 78201',
                context: [
                  { id: 'postcode.123', text: '78201' },
                  { id: 'place.456', text: 'San Antonio' },
                  { id: 'district.789', text: 'Bexar County' },
                ],
              },
            ],
          });
        })
      );

      // Mock DB responses
      const mockFMR = createMockFMR({ two_bedroom: 1200 });
      const mockWaterCCN = createMockCCNArea({ utility_name: 'SAWS', service_type: 'water' });
      const mockPark = { ...createMockCommunity(), distance_miles: 5.0 };

      mockSqlFn.mockImplementation(async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('hud_fair_market_rents')) {
          return [mockFMR];
        }
        if (query.includes("service_type IN ('water', 'both')")) {
          return [mockWaterCCN];
        }
        if (query.includes('ST_DWithin')) {
          return [mockPark];
        }
        return [];
      });

      const result = await lookupParcelData.execute({
        address: '123 Main St, San Antonio, TX',
      });

      // Verify all sections populated
      expect(result.location.coordinates).toBeDefined();
      expect(result.location.zipCode).toBe('78201');
      expect(result.utilities.hasWater).toBe(true);
      expect(result.marketRents).toBeDefined();
      expect(result.nearbyParks.length).toBeGreaterThan(0);
      expect(result.insights.length).toBeGreaterThan(0);
    });
  });
});
