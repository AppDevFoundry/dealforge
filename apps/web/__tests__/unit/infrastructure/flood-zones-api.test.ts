import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the query module
vi.mock('@/lib/infrastructure/queries', () => ({
  getFloodZonesByBbox: vi.fn(),
  getFloodZonesByCounty: vi.fn(),
}));

import { GET } from '@/app/api/v1/infrastructure/flood-zones/route';
import { getFloodZonesByBbox, getFloodZonesByCounty } from '@/lib/infrastructure/queries';
import { createMockFloodZoneFeatureCollection } from '../../utils/factories';

describe('GET /api/v1/infrastructure/flood-zones', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when neither bbox nor county provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/v1/infrastructure/flood-zones');
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid bbox format', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/v1/infrastructure/flood-zones?bbox=invalid'
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('returns 400 for bbox with wrong number of coordinates', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/v1/infrastructure/flood-zones?bbox=-98.5,29.4'
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('returns valid GeoJSON FeatureCollection for bbox query', async () => {
    const mockCollection = createMockFloodZoneFeatureCollection();
    vi.mocked(getFloodZonesByBbox).mockResolvedValue(mockCollection);

    const request = new NextRequest(
      'http://localhost:3000/api/v1/infrastructure/flood-zones?bbox=-98.6,-29.3,-98.4,-29.1'
    );
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.type).toBe('FeatureCollection');
    expect(json.data.features).toHaveLength(mockCollection.features.length);
    expect(getFloodZonesByBbox).toHaveBeenCalledWith([-98.6, -29.3, -98.4, -29.1], false);
  });

  it('passes highRiskOnly=true to query function', async () => {
    const mockCollection = createMockFloodZoneFeatureCollection();
    vi.mocked(getFloodZonesByBbox).mockResolvedValue(mockCollection);

    const request = new NextRequest(
      'http://localhost:3000/api/v1/infrastructure/flood-zones?bbox=-98.6,-29.3,-98.4,-29.1&highRiskOnly=true'
    );
    await GET(request);

    expect(getFloodZonesByBbox).toHaveBeenCalledWith([-98.6, -29.3, -98.4, -29.1], true);
  });

  it('returns valid GeoJSON FeatureCollection for county query', async () => {
    const mockCollection = createMockFloodZoneFeatureCollection();
    vi.mocked(getFloodZonesByCounty).mockResolvedValue(mockCollection);

    const request = new NextRequest(
      'http://localhost:3000/api/v1/infrastructure/flood-zones?county=Bexar'
    );
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.type).toBe('FeatureCollection');
    expect(getFloodZonesByCounty).toHaveBeenCalledWith('Bexar', false);
  });

  it('returns 500 when query throws an error', async () => {
    vi.mocked(getFloodZonesByBbox).mockRejectedValue(new Error('DB connection failed'));

    const request = new NextRequest(
      'http://localhost:3000/api/v1/infrastructure/flood-zones?bbox=-98.6,-29.3,-98.4,-29.1'
    );
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});
