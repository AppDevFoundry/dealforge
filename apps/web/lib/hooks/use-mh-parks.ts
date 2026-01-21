import type { ApiSuccessResponse } from '@/lib/api';
import type { ListMhCommunitiesQuery, MapBounds, MhCommunity } from '@dealforge/types';
import { useQuery } from '@tanstack/react-query';

type ListMhCommunitiesFilters = Partial<ListMhCommunitiesQuery>;

interface PaginatedCommunitiesResponse extends ApiSuccessResponse<MhCommunity[]> {
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

export const mhParkKeys = {
  all: ['mh-parks'] as const,
  lists: () => [...mhParkKeys.all, 'list'] as const,
  list: (filters: ListMhCommunitiesFilters) => [...mhParkKeys.lists(), filters] as const,
  map: (bounds: MapBounds | null) => [...mhParkKeys.all, 'map', bounds] as const,
  details: () => [...mhParkKeys.all, 'detail'] as const,
  detail: (id: string) => [...mhParkKeys.details(), id] as const,
};

export function useMhCommunities(filters: ListMhCommunitiesFilters = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  const url = `/api/v1/mh-parks/communities${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: mhParkKeys.list(filters),
    queryFn: () => fetchApi<PaginatedCommunitiesResponse>(url),
  });
}

export function useMhCommunity(id: string | undefined) {
  return useQuery({
    queryKey: mhParkKeys.detail(id!),
    queryFn: () => fetchApi<ApiSuccessResponse<MhCommunity>>(`/api/v1/mh-parks/communities/${id}`),
    enabled: !!id,
  });
}

export function useMhCommunitiesForMap(bounds: MapBounds | null) {
  const searchParams = new URLSearchParams();

  if (bounds) {
    searchParams.set('swLat', String(bounds.sw.lat));
    searchParams.set('swLng', String(bounds.sw.lng));
    searchParams.set('neLat', String(bounds.ne.lat));
    searchParams.set('neLng', String(bounds.ne.lng));
    searchParams.set('perPage', '250');
  }

  const queryString = searchParams.toString();
  const url = `/api/v1/mh-parks/communities${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: mhParkKeys.map(bounds),
    queryFn: () => fetchApi<PaginatedCommunitiesResponse>(url),
    enabled: !!bounds,
  });
}
