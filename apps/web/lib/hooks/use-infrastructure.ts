import type { ApiSuccessResponse } from '@/lib/api';
import type {
  CcnServiceType,
  GeoJSONFeatureCollection,
  InfrastructureSummary,
} from '@dealforge/types';
import { useQuery } from '@tanstack/react-query';

// ============================================================================
// API Helpers
// ============================================================================

async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Request failed');
  }

  return data;
}

// ============================================================================
// Query Keys
// ============================================================================

export const infrastructureKeys = {
  all: ['infrastructure'] as const,
  ccn: () => [...infrastructureKeys.all, 'ccn'] as const,
  ccnByBbox: (bbox: string | null, serviceType?: CcnServiceType) =>
    [...infrastructureKeys.ccn(), { bbox, serviceType }] as const,
  floodZones: () => [...infrastructureKeys.all, 'flood-zones'] as const,
  floodZonesByBbox: (bbox: string | null, options?: { county?: string; highRiskOnly?: boolean }) =>
    [...infrastructureKeys.floodZones(), { bbox, ...options }] as const,
  checkPoint: (lat: number | null, lng: number | null) =>
    [...infrastructureKeys.all, 'check-point', { lat, lng }] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch CCN service areas within a bounding box
 */
export function useCcnAreas(bbox: string | null, serviceType?: CcnServiceType) {
  const params = new URLSearchParams();
  if (bbox) params.set('bbox', bbox);
  if (serviceType) params.set('serviceType', serviceType);

  const url = `/api/v1/infrastructure/ccn?${params.toString()}`;

  return useQuery({
    queryKey: infrastructureKeys.ccnByBbox(bbox, serviceType),
    queryFn: () =>
      fetchApi<ApiSuccessResponse<GeoJSONFeatureCollection>>(url).then((res) => res.data),
    enabled: bbox != null,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch flood zones within a bounding box
 */
export function useFloodZones(
  bbox: string | null,
  options?: { county?: string; highRiskOnly?: boolean }
) {
  const params = new URLSearchParams();
  if (bbox) params.set('bbox', bbox);
  if (options?.county) params.set('county', options.county);
  if (options?.highRiskOnly) params.set('highRiskOnly', 'true');

  const url = `/api/v1/infrastructure/flood-zones?${params.toString()}`;

  return useQuery({
    queryKey: infrastructureKeys.floodZonesByBbox(bbox, options),
    queryFn: () =>
      fetchApi<ApiSuccessResponse<GeoJSONFeatureCollection>>(url).then((res) => res.data),
    enabled: bbox != null,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to check infrastructure at a specific point
 */
export function useInfrastructureCheck(lat: number | null, lng: number | null) {
  const url = `/api/v1/infrastructure/check-point?lat=${lat}&lng=${lng}`;

  return useQuery({
    queryKey: infrastructureKeys.checkPoint(lat, lng),
    queryFn: () => fetchApi<ApiSuccessResponse<InfrastructureSummary>>(url).then((res) => res.data),
    enabled: lat != null && lng != null,
    staleTime: 5 * 60 * 1000,
  });
}
