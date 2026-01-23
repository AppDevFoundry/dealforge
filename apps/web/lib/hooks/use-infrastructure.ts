import type { ApiSuccessResponse } from '@/lib/api';
import type {
  BBox,
  CcnFacilityFeatureCollection,
  CcnFeatureCollection,
  CcnServiceType,
  FloodZoneFeatureCollection,
  InfrastructureAtPoint,
} from '@dealforge/types';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

interface InfrastructureSummary {
  hasWaterService: boolean;
  hasSewerService: boolean;
  highestFloodRisk: 'high' | 'moderate' | 'low' | 'undetermined' | null;
  ccnCount: number;
  floodZoneCount: number;
}

interface InfrastructureAtPointResponse extends InfrastructureAtPoint {
  summary: InfrastructureSummary;
}

// ============================================================================
// API Helpers
// ============================================================================

async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
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
  ccnByBbox: (bbox: string, serviceType?: CcnServiceType) =>
    [...infrastructureKeys.ccn(), 'bbox', bbox, serviceType] as const,
  ccnFacilities: () => [...infrastructureKeys.all, 'ccn-facilities'] as const,
  ccnFacilitiesByBbox: (bbox: string, serviceType?: CcnServiceType) =>
    [...infrastructureKeys.ccnFacilities(), 'bbox', bbox, serviceType] as const,
  floodZones: () => [...infrastructureKeys.all, 'flood-zones'] as const,
  floodZonesByBbox: (bbox: string, highRiskOnly?: boolean) =>
    [...infrastructureKeys.floodZones(), 'bbox', bbox, highRiskOnly] as const,
  atPoint: (lat: number, lng: number) => [...infrastructureKeys.all, 'point', lat, lng] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Format bbox array to string
 */
function formatBBox(bbox: BBox): string {
  return bbox.join(',');
}

/**
 * Hook to fetch CCN areas by bounding box
 */
export function useCcnAreasByBbox(bbox: BBox | null, serviceType?: CcnServiceType) {
  const bboxStr = bbox ? formatBBox(bbox) : '';

  return useQuery({
    queryKey: infrastructureKeys.ccnByBbox(bboxStr, serviceType),
    queryFn: async () => {
      const params = new URLSearchParams({ bbox: bboxStr });
      if (serviceType) params.set('serviceType', serviceType);
      const res = await fetchApi<ApiSuccessResponse<CcnFeatureCollection>>(
        `/api/v1/infrastructure/ccn?${params}`
      );
      return res.data;
    },
    enabled: !!bbox,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}

/**
 * Hook to fetch CCN facilities (infrastructure lines) by bounding box
 */
export function useCcnFacilitiesByBbox(bbox: BBox | null, serviceType?: CcnServiceType) {
  const bboxStr = bbox ? formatBBox(bbox) : '';

  return useQuery({
    queryKey: infrastructureKeys.ccnFacilitiesByBbox(bboxStr, serviceType),
    queryFn: async () => {
      const params = new URLSearchParams({ bbox: bboxStr });
      if (serviceType) params.set('serviceType', serviceType);
      const res = await fetchApi<CcnFacilityFeatureCollection>(
        `/api/v1/infrastructure/facilities?${params}`
      );
      return res;
    },
    enabled: !!bbox,
    staleTime: 30000,
    gcTime: 300000,
  });
}

/**
 * Hook to fetch flood zones by bounding box
 */
export function useFloodZonesByBbox(bbox: BBox | null, highRiskOnly = false) {
  const bboxStr = bbox ? formatBBox(bbox) : '';

  return useQuery({
    queryKey: infrastructureKeys.floodZonesByBbox(bboxStr, highRiskOnly),
    queryFn: async () => {
      const params = new URLSearchParams({ bbox: bboxStr });
      if (highRiskOnly) params.set('highRiskOnly', 'true');
      const res = await fetchApi<ApiSuccessResponse<FloodZoneFeatureCollection>>(
        `/api/v1/infrastructure/flood-zones?${params}`
      );
      return res.data;
    },
    enabled: !!bbox,
    staleTime: 30000,
    gcTime: 300000,
  });
}

/**
 * Hook to fetch infrastructure at a specific point
 */
export function useInfrastructureAtPoint(lat: number | null, lng: number | null) {
  return useQuery({
    queryKey: infrastructureKeys.atPoint(lat ?? 0, lng ?? 0),
    queryFn: async () => {
      const res = await fetchApi<ApiSuccessResponse<InfrastructureAtPointResponse>>(
        `/api/v1/infrastructure/check-point?lat=${lat}&lng=${lng}`
      );
      return res.data;
    },
    enabled: lat !== null && lng !== null,
    staleTime: 60000, // 1 minute
    gcTime: 300000,
  });
}

/**
 * Hook to fetch all infrastructure data for current map bounds
 * Includes debouncing to prevent excessive requests during map movement
 */
export function useInfrastructure(bbox: BBox | null, options?: { debounceMs?: number }) {
  const { debounceMs = 300 } = options ?? {};
  const [debouncedBbox, setDebouncedBbox] = useState<BBox | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounce bbox updates
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!bbox) {
      setDebouncedBbox(null);
      return;
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedBbox(bbox);
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [bbox, debounceMs]);

  // Fetch CCN areas (water and sewer combined)
  const ccnQuery = useCcnAreasByBbox(debouncedBbox);

  // Fetch CCN facilities (infrastructure lines)
  const facilitiesQuery = useCcnFacilitiesByBbox(debouncedBbox);

  // Fetch flood zones
  const floodZonesQuery = useFloodZonesByBbox(debouncedBbox);

  // Separate water and sewer CCN areas from the combined result
  const ccnWaterGeoJson: CcnFeatureCollection | undefined = ccnQuery.data
    ? {
        type: 'FeatureCollection',
        features: ccnQuery.data.features.filter(
          (f) => f.properties.serviceType === 'water' || f.properties.serviceType === 'both'
        ),
      }
    : undefined;

  const ccnSewerGeoJson: CcnFeatureCollection | undefined = ccnQuery.data
    ? {
        type: 'FeatureCollection',
        features: ccnQuery.data.features.filter(
          (f) => f.properties.serviceType === 'sewer' || f.properties.serviceType === 'both'
        ),
      }
    : undefined;

  // Separate water and sewer facilities
  const facilityWaterGeoJson: CcnFacilityFeatureCollection | undefined = facilitiesQuery.data
    ? {
        type: 'FeatureCollection',
        features: facilitiesQuery.data.features.filter(
          (f) => f.properties.serviceType === 'water' || f.properties.serviceType === 'both'
        ),
      }
    : undefined;

  const facilitySewerGeoJson: CcnFacilityFeatureCollection | undefined = facilitiesQuery.data
    ? {
        type: 'FeatureCollection',
        features: facilitiesQuery.data.features.filter(
          (f) => f.properties.serviceType === 'sewer' || f.properties.serviceType === 'both'
        ),
      }
    : undefined;

  return {
    ccnWaterGeoJson,
    ccnSewerGeoJson,
    facilityWaterGeoJson,
    facilitySewerGeoJson,
    floodZonesGeoJson: floodZonesQuery.data,
    isLoading: ccnQuery.isLoading || facilitiesQuery.isLoading || floodZonesQuery.isLoading,
    isError: ccnQuery.isError || facilitiesQuery.isError || floodZonesQuery.isError,
    error: ccnQuery.error || facilitiesQuery.error || floodZonesQuery.error,
  };
}

/**
 * Hook to get bbox from map bounds
 */
export function useMapBbox(bounds: mapboxgl.LngLatBounds | null): BBox | null {
  return bounds ? [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()] : null;
}
