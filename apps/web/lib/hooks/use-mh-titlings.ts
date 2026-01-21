import type { ApiSuccessResponse } from '@/lib/api';
import type { ListMhTitlingsQuery, MhTitling, TitlingSummary } from '@dealforge/types';
import { useQuery } from '@tanstack/react-query';

type ListMhTitlingsFilters = Partial<ListMhTitlingsQuery>;

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

export const mhTitlingKeys = {
  all: ['mh-titlings'] as const,
  lists: () => [...mhTitlingKeys.all, 'list'] as const,
  list: (filters: ListMhTitlingsFilters) => [...mhTitlingKeys.lists(), filters] as const,
  summary: () => [...mhTitlingKeys.all, 'summary'] as const,
};

export function useMhTitlings(filters: ListMhTitlingsFilters = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  const url = `/api/v1/mh-parks/titlings${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: mhTitlingKeys.list(filters),
    queryFn: () => fetchApi<ApiSuccessResponse<MhTitling[]>>(url),
  });
}

export function useMhTitlingSummary() {
  return useQuery({
    queryKey: mhTitlingKeys.summary(),
    queryFn: () =>
      fetchApi<ApiSuccessResponse<TitlingSummary>>('/api/v1/mh-parks/titlings/summary'),
  });
}
