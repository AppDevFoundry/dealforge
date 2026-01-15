import { NextResponse } from 'next/server';

/**
 * Standard API response types
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
    pagination?: {
      page: number;
      perPage: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a standard success response
 */
export function createSuccessResponse<T>(
  data: T,
  options?: {
    pagination?: {
      page: number;
      perPage: number;
      total: number;
    };
    status?: number;
  }
): NextResponse<ApiSuccessResponse<T>> {
  const pagination = options?.pagination
    ? {
        ...options.pagination,
        totalPages: Math.ceil(options.pagination.total / options.pagination.perPage),
      }
    : undefined;

  return NextResponse.json(
    {
      success: true as const,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        ...(pagination && { pagination }),
      },
    },
    { status: options?.status ?? 200 }
  );
}

/**
 * Create a standard error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: unknown[]
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code,
        message,
        ...(details && { details }),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    },
    { status }
  );
}

/**
 * Common error responses
 */
export const ApiErrors = {
  unauthorized: () => createErrorResponse('UNAUTHORIZED', 'Authentication required', 401),

  forbidden: () => createErrorResponse('FORBIDDEN', 'Access denied', 403),

  notFound: (resource = 'Resource') =>
    createErrorResponse('NOT_FOUND', `${resource} not found`, 404),

  validationError: (details: unknown[]) =>
    createErrorResponse('VALIDATION_ERROR', 'Invalid input', 400, details),

  internalError: (message = 'An unexpected error occurred') =>
    createErrorResponse('INTERNAL_ERROR', message, 500),
};
