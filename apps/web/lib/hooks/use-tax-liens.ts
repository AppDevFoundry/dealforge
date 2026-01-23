import type { ApiSuccessResponse } from '@/lib/api';
import type { TaxLienSearchQuery, TaxLienStats, TaxLienWithCommunity } from '@dealforge/types';
import { useQuery } from '@tanstack/react-query';

// ============================================================================
// Types
// ============================================================================

interface PaginatedTaxLiensResponse extends ApiSuccessResponse<TaxLienWithCommunity[]> {
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

export const taxLienKeys = {
  all: ['tax-liens'] as const,
  lists: () => [...taxLienKeys.all, 'list'] as const,
  list: (filters: Partial<TaxLienSearchQuery>) => [...taxLienKeys.lists(), filters] as const,
  stats: () => [...taxLienKeys.all, 'stats'] as const,
  statsByCounty: (county?: string) => [...taxLienKeys.stats(), { county }] as const,
  byCommunity: (communityId: string) => [...taxLienKeys.all, 'community', communityId] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch a paginated list of tax liens
 */
export function useTaxLiens(filters: Partial<TaxLienSearchQuery> = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  const url = `/api/v1/tax-liens${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: taxLienKeys.list(filters),
    queryFn: () => fetchApi<PaginatedTaxLiensResponse>(url),
  });
}

/**
 * Hook to fetch tax lien statistics
 */
export function useTaxLienStats(county?: string) {
  const url = county ? `/api/v1/tax-liens/stats?county=${county}` : '/api/v1/tax-liens/stats';

  return useQuery({
    queryKey: taxLienKeys.statsByCounty(county),
    queryFn: () => fetchApi<ApiSuccessResponse<TaxLienStats>>(url).then((res) => res.data),
  });
}

/**
 * Hook to fetch tax liens for a specific community
 */
export function useCommunityTaxLiens(communityId: string) {
  const url = `/api/v1/tax-liens?communityId=${communityId}&perPage=100`;

  return useQuery({
    queryKey: taxLienKeys.byCommunity(communityId),
    queryFn: () => fetchApi<PaginatedTaxLiensResponse>(url).then((res) => res.data),
    enabled: !!communityId,
  });
}
