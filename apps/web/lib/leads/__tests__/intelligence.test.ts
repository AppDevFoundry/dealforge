/**
 * Tests for Lead Intelligence Service
 */

import type { Lead } from '@dealforge/database/schema';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../__tests__/utils/msw/server';
import {
  cleanupTestEnv,
  createMockCCNArea,
  createMockCensus,
  createMockCommunity,
  createMockFMR,
  createMockSql,
  setupTestEnv,
} from '../../ai/tools/__tests__/setup';

// Create mock lead factory locally to avoid import issues
let leadIdCounter = 0;
function createMockLead(overrides: Partial<Lead> = {}): Lead {
  leadIdCounter++;
  return {
    id: `lead_${leadIdCounter}`,
    userId: `user_${leadIdCounter}`,
    orgId: null,
    status: 'new',
    address: `${100 + leadIdCounter} Test Street, San Antonio, TX 78201`,
    city: 'San Antonio',
    county: 'Bexar',
    state: 'TX',
    zipCode: '78201',
    latitude: 29.4241 + leadIdCounter * 0.001,
    longitude: -98.4936 + leadIdCounter * 0.001,
    propertyType: 'singlewide',
    propertyCondition: 'good',
    yearBuilt: 1995,
    lotSize: 0.25,
    homeSize: 1200,
    bedrooms: 3,
    bathrooms: 2,
    lotCount: null,
    askingPrice: 85000,
    estimatedValue: 90000,
    lotRent: null,
    monthlyIncome: null,
    annualTaxes: 1500,
    annualInsurance: 800,
    sellerName: 'John Doe',
    sellerPhone: '555-123-4567',
    sellerEmail: 'john@example.com',
    sellerMotivation: 'Moving out of state',
    leadSource: 'direct_mail',
    notes: 'Test lead notes',
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    analyzedAt: null,
    ...overrides,
  };
}

// Mock neon module before importing
const mockSqlFn = createMockSql();
vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn(() => mockSqlFn),
}));

// Mock AI SDK
vi.mock('ai', () => ({
  generateObject: vi.fn().mockResolvedValue({
    object: {
      summary: 'Test AI analysis summary',
      insights: ['Good location', 'Fair market price'],
      risks: ['Property age may require updates'],
      opportunities: ['Strong rental market'],
      recommendation: 'proceed_with_caution',
      confidenceScore: 72,
      suggestedOffer: 80000,
    },
  }),
}));

// Import after mocks are set up
import { gatherLeadIntelligence, saveLeadIntelligence } from '../intelligence';

describe('gatherLeadIntelligence', () => {
  beforeEach(() => {
    setupTestEnv();
    leadIdCounter = 0;
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestEnv();
    server.resetHandlers();
  });

  describe('geocoding', () => {
    it('uses existing coordinates when available on lead', async () => {
      const lead = createMockLead({
        latitude: 29.5,
        longitude: -98.5,
      });

      (mockSqlFn as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await gatherLeadIntelligence(lead);

      // Should not have geocode result since coords were already available
      expect(result.geocode).toBeUndefined();
    });

    it('geocodes address when coordinates are missing', async () => {
      const lead = createMockLead({
        latitude: null,
        longitude: null,
        address: '123 Main St, San Antonio, TX 78201',
      });

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

      (mockSqlFn as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await gatherLeadIntelligence(lead);

      expect(result.geocode).toBeDefined();
      expect(result.geocode?.latitude).toBe(29.4241);
      expect(result.geocode?.longitude).toBe(-98.4936);
    });
  });

  describe('CCN utility coverage', () => {
    it('detects water and sewer coverage', async () => {
      const lead = createMockLead();

      const mockWaterCCN = createMockCCNArea({
        utility_name: 'SAWS Water',
        service_type: 'water',
        ccn_number: '10554',
        county: 'Bexar',
      });
      const mockSewerCCN = createMockCCNArea({
        utility_name: 'SAWS Sewer',
        service_type: 'sewer',
        ccn_number: '20207',
        county: 'Bexar',
      });

      (mockSqlFn as ReturnType<typeof vi.fn>).mockImplementation(
        async (strings: TemplateStringsArray) => {
          const query = strings.join('');
          if (query.includes("service_type IN ('water', 'both')")) {
            return [mockWaterCCN];
          }
          if (query.includes("service_type IN ('sewer', 'both')")) {
            return [mockSewerCCN];
          }
          return [];
        }
      );

      const result = await gatherLeadIntelligence(lead);

      expect(result.hasWaterCoverage).toBe(true);
      expect(result.hasSewerCoverage).toBe(true);
      expect(result.waterCcn?.utilityName).toBe('SAWS Water');
      expect(result.sewerCcn?.utilityName).toBe('SAWS Sewer');
    });

    it('handles no utility coverage', async () => {
      const lead = createMockLead();
      (mockSqlFn as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await gatherLeadIntelligence(lead);

      expect(result.hasWaterCoverage).toBe(false);
      expect(result.hasSewerCoverage).toBe(false);
    });
  });

  describe('flood zone detection', () => {
    it('detects high-risk flood zone', async () => {
      const lead = createMockLead();

      (mockSqlFn as ReturnType<typeof vi.fn>).mockImplementation(
        async (strings: TemplateStringsArray) => {
          const query = strings.join('');
          if (query.includes('flood_zones')) {
            return [{ zone_code: 'AE', zone_description: 'Special Flood Hazard Area' }];
          }
          return [];
        }
      );

      const result = await gatherLeadIntelligence(lead);

      expect(result.floodZone).toBe('AE');
      expect(result.isHighRiskFlood).toBe(true);
    });

    it('detects low-risk flood zone', async () => {
      const lead = createMockLead();

      (mockSqlFn as ReturnType<typeof vi.fn>).mockImplementation(
        async (strings: TemplateStringsArray) => {
          const query = strings.join('');
          if (query.includes('flood_zones')) {
            return [{ zone_code: 'X', zone_description: 'Minimal flood hazard' }];
          }
          return [];
        }
      );

      const result = await gatherLeadIntelligence(lead);

      expect(result.floodZone).toBe('X');
      expect(result.isHighRiskFlood).toBe(false);
    });
  });

  describe('FMR data lookup', () => {
    it('retrieves FMR data for ZIP code', async () => {
      const lead = createMockLead({ zipCode: '78201' });

      const mockFMR = createMockFMR({
        fiscal_year: 2025,
        two_bedroom: 1400,
        county_name: 'Bexar County',
      });

      (mockSqlFn as ReturnType<typeof vi.fn>).mockImplementation(
        async (strings: TemplateStringsArray) => {
          const query = strings.join('');
          if (query.includes('hud_fair_market_rents')) {
            return [mockFMR];
          }
          return [];
        }
      );

      const result = await gatherLeadIntelligence(lead);

      expect(result.fmrData).toBeDefined();
      expect(result.fmrData?.twoBr).toBe(1400);
      expect(result.fmrData?.year).toBe(2025);
    });
  });

  describe('demographics lookup', () => {
    it('retrieves demographics for county', async () => {
      const lead = createMockLead({ county: 'Bexar' });

      const mockCensus = createMockCensus({
        total_population: 2000000,
        median_household_income: 60000,
      });

      (mockSqlFn as ReturnType<typeof vi.fn>).mockImplementation(
        async (strings: TemplateStringsArray) => {
          const query = strings.join('');
          if (query.includes('census_demographics')) {
            return [mockCensus];
          }
          return [];
        }
      );

      const result = await gatherLeadIntelligence(lead);

      expect(result.demographics).toBeDefined();
      expect(result.demographics?.population).toBe(2000000);
      expect(result.demographics?.medianHouseholdIncome).toBe(60000);
    });
  });

  describe('nearby parks', () => {
    it('finds nearby MH parks', async () => {
      const lead = createMockLead();

      const mockPark1 = {
        ...createMockCommunity({
          name: 'Shady Oaks MH Park',
          distress_score: 45,
        }),
        distance_miles: 2.5,
      };
      const mockPark2 = {
        ...createMockCommunity({
          id: 'mhc_2',
          name: 'Sunrise Estates',
        }),
        distance_miles: 5.2,
      };

      (mockSqlFn as ReturnType<typeof vi.fn>).mockImplementation(
        async (strings: TemplateStringsArray) => {
          const query = strings.join('');
          if (query.includes('ST_DWithin') || query.includes('mh_communities')) {
            return [mockPark1, mockPark2];
          }
          return [];
        }
      );

      const result = await gatherLeadIntelligence(lead);

      expect(result.nearbyParks.length).toBe(2);
      expect(result.nearbyParks[0].name).toBe('Shady Oaks MH Park');
      expect(result.nearbyParks[0].distanceMiles).toBe(2.5);
    });
  });

  describe('AI analysis', () => {
    it('generates AI analysis with insights and recommendations', async () => {
      const lead = createMockLead();
      (mockSqlFn as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await gatherLeadIntelligence(lead);

      expect(result.aiAnalysis).toBeDefined();
      expect(result.aiAnalysis?.summary).toBe('Test AI analysis summary');
      expect(result.aiAnalysis?.insights).toContain('Good location');
      expect(result.aiAnalysis?.risks).toContain('Property age may require updates');
      expect(result.aiAnalysis?.recommendation).toBe('proceed_with_caution');
      expect(result.aiAnalysis?.confidenceScore).toBe(72);
    });
  });

  describe('partial failures', () => {
    it('continues gathering other data when geocoding fails', async () => {
      const lead = createMockLead({
        latitude: null,
        longitude: null,
      });

      // Geocoding fails
      server.use(
        http.get('https://api.mapbox.com/geocoding/v5/mapbox.places/*', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      // But FMR lookup can still work since we have zipCode
      const mockFMR = createMockFMR({ two_bedroom: 1200 });
      (mockSqlFn as ReturnType<typeof vi.fn>).mockImplementation(
        async (strings: TemplateStringsArray) => {
          const query = strings.join('');
          if (query.includes('hud_fair_market_rents')) {
            return [mockFMR];
          }
          return [];
        }
      );

      const result = await gatherLeadIntelligence(lead);

      // Geocode should be null/undefined
      expect(result.geocode).toBeUndefined();
      // But FMR should still be populated
      expect(result.fmrData?.twoBr).toBe(1200);
      // AI analysis should still run
      expect(result.aiAnalysis).toBeDefined();
    });

    it('handles database errors gracefully', async () => {
      const lead = createMockLead();

      (mockSqlFn as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Should not throw, should return partial result
      const result = await gatherLeadIntelligence(lead);

      expect(result.hasWaterCoverage).toBe(false);
      expect(result.hasSewerCoverage).toBe(false);
      expect(result.nearbyParks).toEqual([]);
    });
  });
});

describe('saveLeadIntelligence', () => {
  beforeEach(() => {
    setupTestEnv();
    leadIdCounter = 0;
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestEnv();
  });

  it('inserts new intelligence record when none exists', async () => {
    const leadId = 'lead_test123';
    const intelligence = {
      hasWaterCoverage: true,
      hasSewerCoverage: true,
      isHighRiskFlood: false,
      nearbyParks: [],
      waterCcn: {
        county: 'Bexar',
        ccnNumber: '10554',
        serviceType: 'water' as const,
        utilityName: 'SAWS',
      },
      sewerCcn: {
        county: 'Bexar',
        ccnNumber: '20207',
        serviceType: 'sewer' as const,
        utilityName: 'SAWS',
      },
      floodZone: 'X',
      floodZoneDescription: 'Minimal flood hazard',
    };

    // First query checks if record exists - return empty
    // Second query inserts
    let queryCount = 0;
    (mockSqlFn as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      queryCount++;
      if (queryCount === 1) {
        return []; // No existing record
      }
      return []; // Insert result
    });

    await saveLeadIntelligence(leadId, intelligence);

    expect(mockSqlFn).toHaveBeenCalledTimes(2);
  });

  it('updates existing intelligence record', async () => {
    const leadId = 'lead_test123';
    const intelligence = {
      hasWaterCoverage: true,
      hasSewerCoverage: false,
      isHighRiskFlood: false,
      nearbyParks: [],
    };

    // First query returns existing record
    (mockSqlFn as ReturnType<typeof vi.fn>).mockImplementation(
      async (strings: TemplateStringsArray) => {
        const query = strings.join('');
        if (query.includes('SELECT id FROM lead_intelligence')) {
          return [{ id: 'lint_existing' }];
        }
        return [];
      }
    );

    await saveLeadIntelligence(leadId, intelligence);

    // Should have called SELECT and UPDATE
    expect(mockSqlFn).toHaveBeenCalledTimes(2);
  });
});
