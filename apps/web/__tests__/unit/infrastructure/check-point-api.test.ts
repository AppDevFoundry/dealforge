import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the query module
vi.mock('@/lib/infrastructure/queries', () => ({
  getInfrastructureAtPoint: vi.fn(),
}));

import { GET } from '@/app/api/v1/infrastructure/check-point/route';
import { getInfrastructureAtPoint } from '@/lib/infrastructure/queries';

describe('GET /api/v1/infrastructure/check-point', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when lat is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/v1/infrastructure/check-point?lng=-98.49'
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 when lng is missing', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/v1/infrastructure/check-point?lat=29.42'
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid lat value', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/v1/infrastructure/check-point?lat=invalid&lng=-98.49'
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 for lat out of range', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/v1/infrastructure/check-point?lat=91&lng=-98.49'
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('returns correct summary structure with highestFloodRisk', async () => {
    vi.mocked(getInfrastructureAtPoint).mockResolvedValue({
      ccnAreas: [
        {
          id: 'ccn_1',
          ccnNumber: '12345',
          utilityName: 'SA Water',
          serviceType: 'water',
          county: 'Bexar',
        },
      ],
      ccnFacilities: [],
      floodZones: [
        {
          id: 'fz_1',
          zoneCode: 'X',
          zoneDescription: 'Minimal flood hazard',
          county: 'Bexar',
          riskLevel: 'low',
        },
        {
          id: 'fz_2',
          zoneCode: 'AE',
          zoneDescription: 'SFHA with BFE',
          county: 'Bexar',
          riskLevel: 'high',
        },
      ],
    });

    const request = new NextRequest(
      'http://localhost:3000/api/v1/infrastructure/check-point?lat=29.42&lng=-98.49'
    );
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.summary).toEqual({
      hasWaterService: true,
      hasSewerService: false,
      highestFloodRisk: 'high',
      ccnCount: 1,
      floodZoneCount: 2,
    });
  });

  it('returns null highestFloodRisk when no flood zones', async () => {
    vi.mocked(getInfrastructureAtPoint).mockResolvedValue({
      ccnAreas: [],
      ccnFacilities: [],
      floodZones: [],
    });

    const request = new NextRequest(
      'http://localhost:3000/api/v1/infrastructure/check-point?lat=29.42&lng=-98.49'
    );
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.summary.highestFloodRisk).toBeNull();
    expect(json.data.summary.ccnCount).toBe(0);
    expect(json.data.summary.floodZoneCount).toBe(0);
  });

  it('detects sewer service from "both" service type', async () => {
    vi.mocked(getInfrastructureAtPoint).mockResolvedValue({
      ccnAreas: [
        {
          id: 'ccn_1',
          ccnNumber: '12345',
          utilityName: 'Combined Utility',
          serviceType: 'both',
          county: 'Bexar',
        },
      ],
      ccnFacilities: [],
      floodZones: [],
    });

    const request = new NextRequest(
      'http://localhost:3000/api/v1/infrastructure/check-point?lat=29.42&lng=-98.49'
    );
    const response = await GET(request);
    const json = await response.json();

    expect(json.data.summary.hasWaterService).toBe(true);
    expect(json.data.summary.hasSewerService).toBe(true);
  });

  it('returns 500 when query throws an error', async () => {
    vi.mocked(getInfrastructureAtPoint).mockRejectedValue(new Error('DB error'));

    const request = new NextRequest(
      'http://localhost:3000/api/v1/infrastructure/check-point?lat=29.42&lng=-98.49'
    );
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});
