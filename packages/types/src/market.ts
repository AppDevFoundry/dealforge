/**
 * Market data types
 */

export type GeoType = 'zip' | 'county' | 'msa' | 'state';

export type MarketDataType =
  | 'fmr' // Fair Market Rent (HUD)
  | 'population'
  | 'employment'
  | 'income'
  | 'property_tax'
  | 'flood_zone'
  | 'boundary';

export interface MarketData {
  id: string;
  geoType: GeoType;
  geoId: string;
  dataType: MarketDataType;
  dataDate?: Date | null;
  value: Record<string, unknown>;
  source: string;
  fetchedAt: Date;
}

// HUD Fair Market Rent data
export interface FairMarketRent {
  zipCode: string;
  year: number;
  efficiency: number;
  oneBedroom: number;
  twoBedroom: number;
  threeBedroom: number;
  fourBedroom: number;
}

// Census demographic data
export interface DemographicData {
  population: number;
  medianAge: number;
  medianHouseholdIncome: number;
  homeownershipRate: number;
  medianHomeValue: number;
  rentOccupiedPercent: number;
}

// Employment data (BLS)
export interface EmploymentData {
  unemploymentRate: number;
  laborForceSize: number;
  employmentGrowthYoY: number;
}

// Neighborhood report card
export interface NeighborhoodReport {
  zipCode: string;
  demographics: DemographicData;
  employment: EmploymentData;
  fairMarketRent: FairMarketRent;
  riskFactors: RiskFactor[];
  growthIndicators: GrowthIndicator[];
}

export interface RiskFactor {
  type: 'flood' | 'vacancy' | 'crime' | 'economic';
  level: 'low' | 'medium' | 'high';
  description: string;
}

export interface GrowthIndicator {
  type: 'population' | 'employment' | 'permits' | 'income';
  trend: 'growing' | 'stable' | 'declining';
  changePercent: number;
  period: string;
}
