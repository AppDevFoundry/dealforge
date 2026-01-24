import type { ApiSuccessResponse } from '@/lib/api';
import type {
  DistressedParkWithScore,
  DistressedParksQuery,
  MhCommunity,
  MhParkSearchQuery,
  MhParkStats,
  ParkTdhcaData,
  TexasCounty,
  TitlingActivityQuery,
  TitlingTrendDataPoint,
} from '@dealforge/types';
import { useQuery } from '@tanstack/react-query';

// ============================================================================
// Types
// ============================================================================

interface PaginatedMhParksResponse extends ApiSuccessResponse<MhCommunity[]> {
  meta: {
    timestamp: string;
    requestId: string;
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  };
}

interface PaginatedDistressedParksResponse extends ApiSuccessResponse<DistressedParkWithScore[]> {
  meta: {
    timestamp: string;
    requestId: string;
    pagination: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  };
}

// ============================================================================
// API Helpers
// ============================================================================

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
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

export const mhParkKeys = {
  all: ['mh-parks'] as const,
  lists: () => [...mhParkKeys.all, 'list'] as const,
  list: (filters: Partial<MhParkSearchQuery>) => [...mhParkKeys.lists(), filters] as const,
  details: () => [...mhParkKeys.all, 'detail'] as const,
  detail: (id: string) => [...mhParkKeys.details(), id] as const,
  titlings: () => [...mhParkKeys.all, 'titlings'] as const,
  titlingActivity: (query: Partial<TitlingActivityQuery>) =>
    [...mhParkKeys.titlings(), query] as const,
  counties: () => [...mhParkKeys.all, 'counties'] as const,
  countiesList: (activeOnly?: boolean) => [...mhParkKeys.counties(), { activeOnly }] as const,
  tdhca: (id: string) => [...mhParkKeys.all, 'tdhca', id] as const,
  stats: () => [...mhParkKeys.all, 'stats'] as const,
  statsByCounty: (county?: string) => [...mhParkKeys.stats(), { county }] as const,
  distressed: () => [...mhParkKeys.all, 'distressed'] as const,
  distressedList: (filters: Partial<DistressedParksQuery>) =>
    [...mhParkKeys.distressed(), filters] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch a paginated list of MH parks
 */
export function useMhParks(filters: Partial<MhParkSearchQuery> = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  const url = `/api/v1/mh-parks${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: mhParkKeys.list(filters),
    queryFn: () => fetchApi<PaginatedMhParksResponse>(url),
  });
}

/**
 * Hook to fetch a single MH park by ID
 */
export function useMhPark(id: string | undefined) {
  return useQuery({
    queryKey: mhParkKeys.detail(id!),
    queryFn: () => fetchApi<ApiSuccessResponse<MhCommunity>>(`/api/v1/mh-parks/${id}`),
    enabled: !!id,
  });
}

/**
 * Hook to fetch titling activity data
 */
export function useTitlingActivity(query: Partial<TitlingActivityQuery> = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  const url = `/api/v1/mh-parks/titlings${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: mhParkKeys.titlingActivity(query),
    queryFn: () =>
      fetchApi<ApiSuccessResponse<TitlingTrendDataPoint[]>>(url).then((res) => res.data),
  });
}

/**
 * Hook to fetch Texas counties
 */
export function useTexasCounties(activeOnly = true) {
  const url = `/api/v1/mh-parks/counties?activeOnly=${activeOnly}`;

  return useQuery({
    queryKey: mhParkKeys.countiesList(activeOnly),
    queryFn: () => fetchApi<ApiSuccessResponse<TexasCounty[]>>(url).then((res) => res.data),
  });
}

/**
 * Hook to fetch MH park statistics
 */
export function useMhParkStats(county?: string) {
  const url = county ? `/api/v1/mh-parks/stats?county=${county}` : '/api/v1/mh-parks/stats';

  return useQuery({
    queryKey: mhParkKeys.statsByCounty(county),
    queryFn: () => fetchApi<ApiSuccessResponse<MhParkStats>>(url).then((res) => res.data),
  });
}

/**
 * Hook to fetch TDHCA data (lien summary + title activity) for a park
 */
export function useParkTdhcaData(id: string | undefined) {
  return useQuery({
    queryKey: mhParkKeys.tdhca(id!),
    queryFn: () =>
      fetchApi<ApiSuccessResponse<ParkTdhcaData>>(`/api/v1/mh-parks/${id}/tdhca`).then(
        (res) => res.data
      ),
    enabled: !!id,
  });
}

/**
 * Hook to fetch distressed parks with filtering and pagination
 */
export function useDistressedParks(options: Partial<DistressedParksQuery> = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  const url = `/api/v1/mh-parks/distressed${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: mhParkKeys.distressedList(options),
    queryFn: () => fetchApi<PaginatedDistressedParksResponse>(url),
  });
}
