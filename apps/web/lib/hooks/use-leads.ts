import type { ApiSuccessResponse } from '@/lib/api';
import type {
  CreateLeadInput,
  Lead,
  LeadIntelligence,
  LeadWithIntelligence,
  ListLeadsQuery,
  UpdateLeadInput,
} from '@dealforge/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ============================================================================
// Types
// ============================================================================

type ListLeadsFilters = Partial<ListLeadsQuery>;

interface PaginatedLeadsResponse extends ApiSuccessResponse<Lead[]> {
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

interface LeadWithIntelligenceResponse extends ApiSuccessResponse<LeadWithIntelligence> {}

interface AnalyzeLeadResponse
  extends ApiSuccessResponse<{
    lead: Lead;
    intelligence: LeadIntelligence;
  }> {}

interface ReportResponse
  extends ApiSuccessResponse<{
    reportId: string;
    version: number;
    fileName: string;
    createdAt: string;
    downloadUrl: string;
  }> {}

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

export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  list: (filters: ListLeadsFilters) => [...leadKeys.lists(), filters] as const,
  details: () => [...leadKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadKeys.details(), id] as const,
  reports: () => [...leadKeys.all, 'report'] as const,
  report: (id: string) => [...leadKeys.reports(), id] as const,
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch a paginated list of leads
 */
export function useLeads(filters: ListLeadsFilters = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  const url = `/api/v1/leads${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: leadKeys.list(filters),
    queryFn: () => fetchApi<PaginatedLeadsResponse>(url),
  });
}

/**
 * Hook to fetch a single lead by ID with intelligence
 * Automatically polls every 3 seconds while the lead is being analyzed
 */
export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: leadKeys.detail(id!),
    queryFn: () => fetchApi<LeadWithIntelligenceResponse>(`/api/v1/leads/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      // Poll every 3 seconds while analyzing, stop when complete
      return status === 'analyzing' ? 3000 : false;
    },
  });
}

/**
 * Hook to create a new lead
 */
export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLeadInput) =>
      fetchApi<ApiSuccessResponse<Lead>>('/api/v1/leads', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
}

/**
 * Hook to update an existing lead
 */
export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadInput }) =>
      fetchApi<ApiSuccessResponse<Lead>>(`/api/v1/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(id) });
    },
  });
}

/**
 * Hook to delete a lead with optimistic update
 */
export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<ApiSuccessResponse<{ id: string; deleted: boolean }>>(`/api/v1/leads/${id}`, {
        method: 'DELETE',
      }),
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: leadKeys.lists() });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: leadKeys.lists() });

      // Optimistically remove the lead from all list queries
      queryClient.setQueriesData<PaginatedLeadsResponse>({ queryKey: leadKeys.lists() }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.filter((lead) => lead.id !== deletedId),
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
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
}

/**
 * Hook to trigger re-analysis of a lead
 */
export function useAnalyzeLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<AnalyzeLeadResponse>(`/api/v1/leads/${id}/analyze`, {
        method: 'POST',
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() });
    },
  });
}

/**
 * Hook to generate a report for a lead
 */
export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, regenerate = false }: { id: string; regenerate?: boolean }) =>
      fetchApi<ReportResponse>(`/api/v1/leads/${id}/report${regenerate ? '?regenerate=true' : ''}`),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.report(id) });
    },
  });
}

/**
 * Hook to fetch the latest report for a lead
 */
export function useLeadReport(id: string | undefined) {
  return useQuery({
    queryKey: leadKeys.report(id!),
    queryFn: () => fetchApi<ReportResponse>(`/api/v1/leads/${id}/report`),
    enabled: !!id,
    staleTime: 60 * 1000, // Consider fresh for 1 minute
  });
}
