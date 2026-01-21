/**
 * Deal-related types and Zod schemas
 */

import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const DealTypeSchema = z.enum([
  'rental',
  'brrrr',
  'flip',
  'house_hack',
  'multifamily',
  'commercial',
  'syndication',
  'mh_park',
]);
export type DealType = z.infer<typeof DealTypeSchema>;

export const DealStatusSchema = z.enum(['draft', 'analyzing', 'archived']);
export type DealStatus = z.infer<typeof DealStatusSchema>;

// ============================================================================
// Core Types
// ============================================================================

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Deal {
  id: string;
  userId: string;
  orgId?: string | null;
  type: DealType;
  name: string;
  status: DealStatus;
  address?: string | null;
  location?: GeoPoint | null;
  inputs: Record<string, unknown>;
  results?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  isPublic: boolean;
  publicSlug?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface DealTag {
  dealId: string;
  tag: string;
}

// ============================================================================
// API Request Schemas
// ============================================================================

/**
 * Schema for creating a new deal
 */
export const CreateDealSchema = z.object({
  type: DealTypeSchema,
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  address: z.string().max(500).optional(),
  inputs: z.record(z.unknown()),
  results: z.record(z.unknown()).optional(),
});
export type CreateDealInput = z.infer<typeof CreateDealSchema>;

/**
 * Schema for updating an existing deal
 */
export const UpdateDealSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: DealStatusSchema.optional(),
  address: z.string().max(500).nullable().optional(),
  inputs: z.record(z.unknown()).optional(),
  results: z.record(z.unknown()).nullable().optional(),
  isPublic: z.boolean().optional(),
});
export type UpdateDealInput = z.infer<typeof UpdateDealSchema>;

/**
 * Schema for listing deals query parameters
 */
export const ListDealsQuerySchema = z.object({
  type: DealTypeSchema.optional(),
  status: DealStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type ListDealsQuery = z.infer<typeof ListDealsQuerySchema>;
