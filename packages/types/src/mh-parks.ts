/**
 * MH Park types and interfaces
 */

// ============================================
// MH Park Calculator Types
// ============================================

/**
 * MH Park Calculator Inputs
 */
export interface MhParkCalculatorInputs {
  // Property Info
  lotCount: number;
  occupiedLots: number;
  avgLotRent: number;
  purchasePrice: number;

  // Financing
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: number;
  closingCostsPercent: number;

  // Income & Expenses
  expenseRatioPercent: number;
  otherIncomeMonthly: number;

  // Valuation
  marketCapRate: number;
}

/**
 * MH Park Calculator Results
 */
export interface MhParkCalculatorResults {
  // Occupancy
  occupancyRate: number;

  // Income Analysis
  grossPotentialRent: number;
  effectiveGrossIncome: number;
  vacancyLoss: number;
  otherIncomeAnnual: number;

  // Expense Analysis
  totalOperatingExpenses: number;

  // Net Operating Income
  netOperatingIncome: number;
  noiPerLot: number;

  // Financing
  loanAmount: number;
  downPayment: number;
  closingCosts: number;
  totalInvestment: number;
  monthlyDebtService: number;
  annualDebtService: number;

  // Key Metrics
  capRate: number;
  cashOnCashReturn: number;
  debtServiceCoverageRatio: number;

  // Cash Flow
  monthlyCashFlow: number;
  annualCashFlow: number;

  // Valuation
  pricePerLot: number;
  estimatedMarketValue: number;
  grossRentMultiplier: number;
}

// ============================================
// MH Community Types
// ============================================

/**
 * MH Community (park) from database
 */
export interface MhCommunity {
  id: string;
  name: string;
  address: string | null;
  city: string;
  county: string;
  state: string;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  lotCount: number | null;
  estimatedOccupancy: number | null;
  propertyType: 'all_ages' | 'senior_55+' | 'family' | null;
  ownerName: string | null;
  source: string;
  sourceUpdatedAt: Date | null;
  metadata: Record<string, unknown> | null;
  distressScore: number | null;
  distressFactors: DistressFactors | null;
  distressUpdatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MH Titling activity record
 */
export interface MhTitling {
  id: string;
  county: string;
  month: Date;
  newTitles: number;
  transfers: number;
  totalActive: number | null;
  source: string;
  createdAt: Date;
}

/**
 * Texas County reference data
 */
export interface TexasCounty {
  id: string;
  name: string;
  fipsCode: string;
  region: string | null;
  centerLat: number | null;
  centerLng: number | null;
  isActive: boolean;
  createdAt: Date;
}

// ============================================
// API Query Types
// ============================================

/**
 * MH Parks search query params
 */
export interface MhParkSearchQuery {
  county?: string;
  city?: string;
  minLots?: number;
  maxLots?: number;
  propertyType?: 'all_ages' | 'senior_55+' | 'family';
  page?: number;
  perPage?: number;
  sortBy?: 'name' | 'lotCount' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Titling activity query params
 */
export interface TitlingActivityQuery {
  county?: string;
  startMonth?: string; // ISO date string
  endMonth?: string; // ISO date string
}

/**
 * MH Park stats summary
 */
export interface MhParkStats {
  totalParks: number;
  totalLots: number;
  avgLotCount: number;
  avgOccupancy: number | null;
  parksWithCoordinates: number;
  countyCount: number;
  parksByType: {
    all_ages: number;
    'senior_55+': number;
    family: number;
    unknown: number;
  };
}

/**
 * Titling trend data point
 */
export interface TitlingTrendDataPoint {
  month: string;
  county: string;
  newTitles: number;
  transfers: number;
  totalActive: number | null;
}

// ============================================
// Distress Scoring Types
// ============================================

export interface DistressFactors {
  lienRatio: number;
  taxBurden: number;
  recency: number;
  persistence: number;
  activeLienCount: number;
  totalTaxOwed: number;
  taxYearsWithLiens: number;
}

export interface DistressedParkResult {
  communityId: string;
  name: string;
  address: string | null;
  city: string;
  county: string;
  lotCount: number | null;
  latitude: number | null;
  longitude: number | null;
  distressScore: number;
  distressFactors: DistressFactors;
  distressUpdatedAt: string;
}

export interface DistressedParksQuery {
  county?: string;
  minScore?: number;
  limit?: number;
  sortBy?: 'score' | 'lienCount' | 'taxOwed';
}

// ============================================
// TDHCA Data Types
// ============================================

/**
 * Tax lien summary for a community
 */
export interface TaxLienSummary {
  communityId: string;
  totalLiens: number;
  activeLiens: number;
  releasedLiens: number;
  totalTaxAmount: number;
  avgTaxAmount: number;
  mostRecentLienDate: string | null;
  taxYearsSpanned: number[];
}

/**
 * Title activity record for a community
 */
export interface TitleActivity {
  certificateNumber: string;
  ownerName: string;
  saleDate: string;
  sellerName: string;
  electionType: string;
  issueDate: string;
}

/**
 * Combined TDHCA data for a park
 */
export interface ParkTdhcaData {
  lienSummary: TaxLienSummary | null;
  titleActivity: TitleActivity[];
}
