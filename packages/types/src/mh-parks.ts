/**
 * MH Parks types and Zod schemas
 */

import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const MhPropertyTypeSchema = z.enum(['family', 'senior', 'mixed', 'unknown']);
export type MhPropertyType = z.infer<typeof MhPropertyTypeSchema>;

// ============================================================================
// Core Types
// ============================================================================

export interface MhCommunity {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  county: string;
  state: string;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  lotCount: number | null;
  estimatedOccupancy: number | null;
  propertyType: MhPropertyType;
  ownerName: string | null;
  ownerAddress: string | null;
  cadPropertyId: string | null;
  source: string;
  sourceUpdatedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MhTitling {
  id: string;
  county: string;
  month: Date | string;
  newTitles: number | null;
  transfers: number | null;
  totalActive: number | null;
  sourceReport: string | null;
  createdAt: Date | string;
}

// ============================================================================
// Map Types
// ============================================================================

export interface MapBounds {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}

export interface MapCommunityPin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  lotCount: number | null;
  propertyType: MhPropertyType;
}

// ============================================================================
// Calculator Types
// ============================================================================

export interface MhParkInputs {
  lotCount: number;
  averageLotRent: number;
  occupancyRate: number;
  expenseRatio: number;
  purchasePrice: number;
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: number;
  amortizationYears: number;
}

export interface MhParkResults {
  grossPotentialIncome: number;
  vacancyLoss: number;
  effectiveGrossIncome: number;
  totalOperatingExpenses: number;
  netOperatingIncome: number;
  capRate: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  cashOnCashReturn: number;
  loanAmount: number;
  monthlyDebtService: number;
  annualDebtService: number;
  totalInvestment: number;
  debtServiceCoverageRatio: number;
  noiPerLot: number;
  pricePerLot: number;
}

// ============================================================================
// Summary Types
// ============================================================================

export interface TitlingMonthlyTotal {
  month: string;
  newTitles: number;
  transfers: number;
  totalActive: number;
}

export interface TitlingCountySummary {
  county: string;
  newTitles: number;
  transfers: number;
  trend: number;
}

export interface TitlingSummary {
  monthlyTotals: TitlingMonthlyTotal[];
  topCounties: TitlingCountySummary[];
}

// ============================================================================
// API Query Schemas
// ============================================================================

export const ListMhCommunitiesQuerySchema = z.object({
  county: z.string().optional(),
  city: z.string().optional(),
  propertyType: MhPropertyTypeSchema.optional(),
  lotCountMin: z.coerce.number().int().min(0).optional(),
  lotCountMax: z.coerce.number().int().max(10000).optional(),
  search: z.string().optional(),
  swLat: z.coerce.number().optional(),
  swLng: z.coerce.number().optional(),
  neLat: z.coerce.number().optional(),
  neLng: z.coerce.number().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(250).default(50),
  sortBy: z.enum(['name', 'lotCount', 'county', 'city', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
export type ListMhCommunitiesQuery = z.infer<typeof ListMhCommunitiesQuerySchema>;

export const ListMhTitlingsQuerySchema = z.object({
  county: z.string().optional(),
  startMonth: z.string().optional(),
  endMonth: z.string().optional(),
});
export type ListMhTitlingsQuery = z.infer<typeof ListMhTitlingsQuerySchema>;
