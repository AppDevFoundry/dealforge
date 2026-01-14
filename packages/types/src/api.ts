/**
 * API response types
 */

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
  meta: ApiMeta;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface ApiMeta {
  timestamp: string;
  requestId: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

// Common error codes
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'
  | 'RATE_LIMITED'
  | 'BAD_REQUEST';

// Pagination params
export interface PaginationParams {
  page?: number;
  perPage?: number;
}

// Sort params
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
