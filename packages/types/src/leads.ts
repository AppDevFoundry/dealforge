/**
 * Lead-related types and Zod schemas
 */

import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const LeadStatusSchema = z.enum(['new', 'analyzing', 'analyzed', 'contacted', 'archived']);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const PropertyTypeSchema = z.enum([
  'manufactured_home',
  'mobile_home',
  'land_only',
  'improved_lot',
  'tiny_house',
]);
export type PropertyType = z.infer<typeof PropertyTypeSchema>;

export const ConditionSchema = z.enum(['excellent', 'good', 'fair', 'poor', 'needs_work']);
export type Condition = z.infer<typeof ConditionSchema>;

// ============================================================================
// Core Types
// ============================================================================

export interface Lead {
  id: string;
  userId: string;
  status: LeadStatus;
  addressRaw: string;
  addressNormalized?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  county?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  propertyType?: PropertyType | null;
  yearBuilt?: number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  acreage?: number | null;
  condition?: Condition | null;
  conditionNotes?: string | null;
  askingPrice?: number | null;
  mortgageBalance?: number | null;
  taxesOwed?: number | null;
  estimatedRepairs?: number | null;
  sellerName?: string | null;
  sellerPhone?: string | null;
  sellerEmail?: string | null;
  sellerMotivation?: string | null;
  sellerTimeframe?: string | null;
  leadSource?: string | null;
  features?: string[];
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  analyzedAt?: Date | string | null;
}

export interface LeadIntelligence {
  id: string;
  leadId: string;
  hasWaterCcn: boolean;
  waterProvider?: string | null;
  hasSewerCcn: boolean;
  sewerProvider?: string | null;
  floodZone?: string | null;
  fmrFiscalYear?: number | null;
  fmrTwoBedroom?: number | null;
  suggestedLotRentLow?: number | null;
  suggestedLotRentHigh?: number | null;
  medianHouseholdIncome?: number | null;
  unemploymentRate?: number | null;
  populationGrowthRate?: number | null;
  mobileHomesPercent?: number | null;
  nearbyParksCount: number;
  nearbyParksData?: Array<{
    id: string;
    name: string;
    distanceMiles: number;
    lotCount?: number | null;
    distressScore?: number | null;
  }>;
  recordId?: string | null;
  ownerName?: string | null;
  manufacturer?: string | null;
  modelYear?: number | null;
  hasLiens: boolean;
  totalLienAmount?: number | null;
  aiInsights?: string[];
  aiRiskFactors?: string[];
  aiOpportunities?: string[];
  aiRecommendation?: string | null;
  aiConfidenceScore?: number | null;
  rawResponses?: Record<string, unknown>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LeadReport {
  id: string;
  leadId: string;
  reportType: string;
  version: number;
  fileName?: string | null;
  fileSizeBytes?: number | null;
  generatedBy: string;
  fileUrl?: string | null;
  generatedAt: Date | string;
  createdAt: Date | string;
}

// ============================================================================
// API Request Schemas
// ============================================================================

export const CreateLeadSchema = z.object({
  addressRaw: z.string().min(5, 'Address is too short').max(500),
  addressNormalized: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zipCode: z.string().max(10).optional(),
  county: z.string().max(100).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  propertyType: PropertyTypeSchema.optional(),
  yearBuilt: z.number().int().optional(),
  beds: z.number().int().optional(),
  baths: z.number().int().optional(),
  sqft: z.number().int().optional(),
  acreage: z.number().optional(),
  condition: ConditionSchema.optional(),
  conditionNotes: z.string().max(1000).optional(),
  askingPrice: z.number().optional(),
  mortgageBalance: z.number().optional(),
  taxesOwed: z.number().optional(),
  estimatedRepairs: z.number().optional(),
  sellerName: z.string().max(200).optional(),
  sellerPhone: z.string().max(50).optional(),
  sellerEmail: z.string().email().max(200).optional(),
  sellerMotivation: z.string().max(500).optional(),
  sellerTimeframe: z.string().max(200).optional(),
  leadSource: z.string().max(100).optional(),
  features: z.array(z.string()).default([]),
  notes: z.string().max(5000).optional(),
});
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

export const UpdateLeadSchema = z.object({
  status: LeadStatusSchema.optional(),
  propertyType: PropertyTypeSchema.optional(),
  yearBuilt: z.number().int().optional(),
  beds: z.number().int().optional(),
  baths: z.number().int().optional(),
  sqft: z.number().int().optional(),
  acreage: z.number().optional(),
  condition: ConditionSchema.optional(),
  conditionNotes: z.string().max(1000).nullable().optional(),
  askingPrice: z.number().optional(),
  mortgageBalance: z.number().optional(),
  taxesOwed: z.number().optional(),
  estimatedRepairs: z.number().optional(),
  sellerName: z.string().max(200).nullable().optional(),
  sellerPhone: z.string().max(50).nullable().optional(),
  sellerEmail: z.string().email().max(200).nullable().optional(),
  sellerMotivation: z.string().max(500).nullable().optional(),
  sellerTimeframe: z.string().max(200).nullable().optional(),
  leadSource: z.string().max(100).nullable().optional(),
  features: z.array(z.string()).optional(),
  notes: z.string().max(5000).nullable().optional(),
});
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;

export const ListLeadsQuerySchema = z.object({
  status: LeadStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type ListLeadsQuery = z.infer<typeof ListLeadsQuerySchema>;
