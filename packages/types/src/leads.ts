/**
 * Lead-related types and Zod schemas
 */

import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const LeadStatusSchema = z.enum([
  'new',
  'analyzing',
  'analyzed',
  'interested',
  'passed',
  'in_progress',
  'closed',
  'dead',
]);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const PropertyTypeSchema = z.enum([
  'singlewide',
  'doublewide',
  'land_only',
  'land_with_home',
  'park',
  'other',
]);
export type PropertyType = z.infer<typeof PropertyTypeSchema>;

export const PropertyConditionSchema = z.enum([
  'excellent',
  'good',
  'average',
  'fair',
  'poor',
  'needs_rehab',
  'unknown',
]);
export type PropertyCondition = z.infer<typeof PropertyConditionSchema>;

export const LeadSourceSchema = z.enum([
  'direct_mail',
  'cold_call',
  'referral',
  'zillow',
  'facebook',
  'craigslist',
  'wholesaler',
  'mls',
  'driving_for_dollars',
  'ai_scout',
  'other',
]);
export type LeadSource = z.infer<typeof LeadSourceSchema>;

// ============================================================================
// Core Types
// ============================================================================

export interface Lead {
  id: string;
  userId: string;
  orgId?: string | null;
  status: LeadStatus;

  // Address
  address: string;
  city?: string | null;
  county?: string | null;
  state?: string | null;
  zipCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;

  // Property details
  propertyType?: PropertyType | null;
  propertyCondition?: PropertyCondition | null;
  yearBuilt?: number | null;
  lotSize?: number | null;
  homeSize?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  lotCount?: number | null;

  // Financials
  askingPrice?: number | null;
  estimatedValue?: number | null;
  lotRent?: number | null;
  monthlyIncome?: number | null;
  annualTaxes?: number | null;
  annualInsurance?: number | null;

  // Seller info
  sellerName?: string | null;
  sellerPhone?: string | null;
  sellerEmail?: string | null;
  sellerMotivation?: string | null;
  leadSource?: string | null;

  // Notes
  notes?: string | null;

  // Metadata
  metadata?: Record<string, unknown> | null;

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
  analyzedAt?: Date | string | null;
}

export interface CcnCoverage {
  utilityName: string;
  ccnNumber?: string | null;
  serviceType: string;
  county?: string | null;
}

export interface FmrData {
  year: number;
  efficiency?: number | null;
  oneBr?: number | null;
  twoBr?: number | null;
  threeBr?: number | null;
  fourBr?: number | null;
  areaName?: string | null;
}

export interface Demographics {
  population?: number | null;
  medianHouseholdIncome?: number | null;
  medianAge?: number | null;
  povertyRate?: number | null;
  unemploymentRate?: number | null;
  housingUnits?: number | null;
  ownerOccupiedRate?: number | null;
  medianHomeValue?: number | null;
  dataYear?: number | null;
}

export interface TdhcaMatch {
  recordId: string;
  labelOrHud: string;
  manufacturer?: string | null;
  yearMfg?: number | null;
  serialNumber?: string | null;
  hasLien?: boolean;
  lienAmount?: number | null;
  lienHolder?: string | null;
}

export interface NearbyPark {
  id: string;
  name: string;
  city: string;
  county: string;
  lotCount?: number | null;
  distanceMiles: number;
  distressScore?: number | null;
}

export interface AiAnalysis {
  summary: string;
  insights: string[];
  risks: string[];
  opportunities: string[];
  recommendation: 'pursue' | 'pass' | 'needs_more_info';
  recommendationReason: string;
  estimatedARV?: number | null;
  suggestedOffer?: number | null;
  analyzedAt: string;
}

export interface LeadIntelligence {
  id: string;
  leadId: string;

  // CCN Coverage
  waterCcn?: CcnCoverage | null;
  sewerCcn?: CcnCoverage | null;
  hasWaterCoverage?: boolean | null;
  hasSewerCoverage?: boolean | null;

  // Flood zone
  floodZone?: string | null;
  floodZoneDescription?: string | null;
  isHighRiskFlood?: boolean | null;

  // Fair Market Rent
  fmrData?: FmrData | null;

  // Demographics
  demographics?: Demographics | null;

  // TDHCA match
  tdhcaMatch?: TdhcaMatch | null;

  // Nearby parks
  nearbyParks?: NearbyPark[] | null;

  // AI Analysis
  aiAnalysis?: AiAnalysis | null;
  aiAnalyzedAt?: Date | string | null;

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LeadReport {
  id: string;
  leadId: string;
  version: number;
  fileName: string;
  reportData: Record<string, unknown>;
  createdAt: Date | string;
}

export interface LeadWithIntelligence extends Lead {
  intelligence?: LeadIntelligence | null;
}

// ============================================================================
// API Request Schemas
// ============================================================================

/**
 * Helper to create optional number schema that handles empty strings from forms.
 * HTML form inputs return empty strings for empty fields, which need to be
 * converted to undefined before number validation.
 */
const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    if (typeof val === 'string') {
      const parsed = Number(val);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return val;
  }, schema.optional());

/**
 * Helper to create optional enum schema that handles empty strings from forms.
 * Select components often return empty strings for unselected values.
 */
const optionalEnum = <T extends z.ZodEnum<[string, ...string[]]>>(schema: T) =>
  z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    return val;
  }, schema.optional());

/**
 * Schema for creating a new lead
 */
export const CreateLeadSchema = z.object({
  // Required
  address: z.string().min(1, 'Address is required').max(500),

  // Optional property details (enums need preprocessing to handle empty strings from selects)
  propertyType: optionalEnum(PropertyTypeSchema),
  propertyCondition: optionalEnum(PropertyConditionSchema),
  yearBuilt: optionalNumber(z.number().int().min(1900).max(2030)),
  lotSize: optionalNumber(z.number().positive()),
  homeSize: optionalNumber(z.number().positive()),
  bedrooms: optionalNumber(z.number().int().min(0).max(20)),
  bathrooms: optionalNumber(z.number().min(0).max(20)),
  lotCount: optionalNumber(z.number().int().positive()),

  // Financials
  askingPrice: optionalNumber(z.number().int().positive()),
  estimatedValue: optionalNumber(z.number().int().positive()),
  lotRent: optionalNumber(z.number().int().positive()),
  monthlyIncome: optionalNumber(z.number().int().positive()),
  annualTaxes: optionalNumber(z.number().int().positive()),
  annualInsurance: optionalNumber(z.number().int().positive()),

  // Seller info
  sellerName: z.string().max(200).optional(),
  sellerPhone: z.string().max(20).optional(),
  sellerEmail: z.string().email().max(200).optional().or(z.literal('')),
  sellerMotivation: z.string().max(2000).optional(),
  leadSource: LeadSourceSchema.optional(),

  // Notes
  notes: z.string().max(10000).optional(),
});
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

/**
 * Helper for optional nullable number fields (for updates where null clears the value)
 */
const optionalNullableNumber = (schema: z.ZodNumber) =>
  z.preprocess((val) => {
    if (val === '' || val === undefined) return undefined;
    if (val === null) return null;
    if (typeof val === 'string') {
      const parsed = Number(val);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return val;
  }, schema.nullable().optional());

/**
 * Helper for optional nullable enum fields (for updates where null clears the value)
 */
const optionalNullableEnum = <T extends z.ZodEnum<[string, ...string[]]>>(schema: T) =>
  z.preprocess((val) => {
    if (val === '' || val === undefined) return undefined;
    if (val === null) return null;
    return val;
  }, schema.nullable().optional());

/**
 * Schema for updating an existing lead
 */
export const UpdateLeadSchema = z.object({
  // Status
  status: LeadStatusSchema.optional(),

  // Address (normally shouldn't change, but allowed)
  address: z.string().min(1).max(500).optional(),

  // Property details (enums need preprocessing to handle empty strings from selects)
  propertyType: optionalNullableEnum(PropertyTypeSchema),
  propertyCondition: optionalNullableEnum(PropertyConditionSchema),
  yearBuilt: optionalNullableNumber(z.number().int().min(1900).max(2030)),
  lotSize: optionalNullableNumber(z.number().positive()),
  homeSize: optionalNullableNumber(z.number().positive()),
  bedrooms: optionalNullableNumber(z.number().int().min(0).max(20)),
  bathrooms: optionalNullableNumber(z.number().min(0).max(20)),
  lotCount: optionalNullableNumber(z.number().int().positive()),

  // Financials
  askingPrice: optionalNullableNumber(z.number().int().positive()),
  estimatedValue: optionalNullableNumber(z.number().int().positive()),
  lotRent: optionalNullableNumber(z.number().int().positive()),
  monthlyIncome: optionalNullableNumber(z.number().int().positive()),
  annualTaxes: optionalNullableNumber(z.number().int().positive()),
  annualInsurance: optionalNullableNumber(z.number().int().positive()),

  // Seller info
  sellerName: z.string().max(200).nullable().optional(),
  sellerPhone: z.string().max(20).nullable().optional(),
  sellerEmail: z.string().email().max(200).nullable().optional().or(z.literal('')),
  sellerMotivation: z.string().max(2000).nullable().optional(),
  leadSource: LeadSourceSchema.nullable().optional(),

  // Notes
  notes: z.string().max(10000).nullable().optional(),
});
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;

/**
 * Schema for listing leads query parameters
 */
export const ListLeadsQuerySchema = z.object({
  status: LeadStatusSchema.optional(),
  propertyType: PropertyTypeSchema.optional(),
  county: z.string().optional(),
  zipCode: z.string().optional(),
  minPrice: z.coerce.number().int().positive().optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'askingPrice', 'address', 'status'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});
export type ListLeadsQuery = z.infer<typeof ListLeadsQuerySchema>;
