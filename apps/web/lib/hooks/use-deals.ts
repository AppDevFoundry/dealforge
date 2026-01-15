import type { ApiSuccessResponse } from '@/lib/api';
import type { CreateDealInput, Deal, ListDealsQuery, UpdateDealInput } from '@dealforge/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ============================================================================
// Types
// ============================================================================

type ListDealsFilters = Partial<ListDealsQuery>;

interface PaginatedDealsResponse extends ApiSuccessResponse<Deal[]> {
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

export const dealKeys = {
  all: ['deals'] as const,
  lists: () => [...dealKeys.all, 'list'] as const,
  list: (filters: ListDealsFilters) => [...dealKeys.lists(), filters] as const,
  details: () => [...dealKeys.all, 'detail'] as const,
  detail: (id: string) => [...dealKeys.details(), id] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch a paginated list of deals
 */
export function useDeals(filters: ListDealsFilters = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  const url = `/api/v1/deals${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: dealKeys.list(filters),
    queryFn: () => fetchApi<PaginatedDealsResponse>(url),
  });
}

/**
 * Hook to fetch a single deal by ID
 */
export function useDeal(id: string | undefined) {
  return useQuery({
    queryKey: dealKeys.detail(id!),
    queryFn: () => fetchApi<ApiSuccessResponse<Deal>>(`/api/v1/deals/${id}`),
    enabled: !!id,
  });
}

/**
 * Hook to create a new deal
 */
export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDealInput) =>
      fetchApi<ApiSuccessResponse<Deal>>('/api/v1/deals', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
    },
  });
}

/**
 * Hook to update an existing deal
 */
export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDealInput }) =>
      fetchApi<ApiSuccessResponse<Deal>>(`/api/v1/deals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(id) });
    },
  });
}

/**
 * Hook to delete a deal with optimistic update
 */
export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiSuccessResponse<{ id: string; deleted: boolean }>>(`/api/v1/deals/${id}`, {
        method: 'DELETE',
      }),
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: dealKeys.lists() });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: dealKeys.lists() });

      // Optimistically remove the deal from all list queries
      queryClient.setQueriesData<PaginatedDealsResponse>({ queryKey: dealKeys.lists() }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((deal) => deal.id !== deletedId),
          meta: {
            ...old.meta,
            pagination: {
              ...old.meta.pagination,
              total: old.meta.pagination.total - 1,
            },
          },
        };
      });

      return { previousData };
    },
    onError: (_err, _deletedId, context) => {
      // Rollback on error
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      // Refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: dealKeys.lists() });
    },
  });
}
