import type { ApiSuccessResponse } from '@/lib/api';
import type {
  CreateLeadInput,
  Lead,
  LeadIntelligence,
  ListLeadsQuery,
  UpdateLeadInput,
} from '@dealforge/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ============================================================================
// Types
// ============================================================================

type ListLeadsFilters = Partial<ListLeadsQuery>;

interface LeadWithFlag extends Lead {
  hasIntelligence: boolean;
}

interface PaginatedLeadsResponse extends ApiSuccessResponse<LeadWithFlag[]> {
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

interface LeadDetailResponse
  extends ApiSuccessResponse<{
    lead: Lead;
    intelligence: LeadIntelligence | null;
    job: { id: string; status: string; error_message?: string | null } | null;
  }> {}

// ============================================================================
// API Helpers
// ============================================================================

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
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
};

// ============================================================================
// Hooks
// ============================================================================

export function useLeads(filters: ListLeadsFilters = {}) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) searchParams.set(key, String(value));
  }
  const queryString = searchParams.toString();
  const url = `/api/v1/leads${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: leadKeys.list(filters),
    queryFn: () => fetchApi<PaginatedLeadsResponse>(url),
  });
}

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: leadKeys.detail(id!),
    queryFn: () => fetchApi<LeadDetailResponse>(`/api/v1/leads/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      // Poll while analyzing
      const data = query.state.data?.data;
      if (data?.lead?.status === 'analyzing') return 3000;
      return false;
    },
  });
}

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
