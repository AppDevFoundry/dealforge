/**
 * Tax Lien types and interfaces
 */

// ============================================
// Tax Lien Types
// ============================================

/**
 * Tax Lien record from TDHCA
 */
export interface TaxLien {
  id: string;
  serialNumber: string | null;
  hudLabel: string | null;
  county: string;
  taxingEntity: string | null;
  amount: number | null;
  year: number | null;
  status: 'active' | 'released';
  filedDate: Date | null;
  releasedDate: Date | null;
  communityId: string | null;
  sourceUpdatedAt: Date | null;
  createdAt: Date;
}

/**
 * Tax Lien with linked community info
 */
export interface TaxLienWithCommunity extends TaxLien {
  community?: {
    id: string;
    name: string;
    city: string;
  } | null;
}

/**
 * Tax Lien aggregate statistics
 */
export interface TaxLienStats {
  totalActive: number;
  totalReleased: number;
  totalAmount: number;
  avgAmount: number;
  byCounty: TaxLienCountyStats[];
  byYear: TaxLienYearStats[];
}

/**
 * Tax liens grouped by county
 */
export interface TaxLienCountyStats {
  county: string;
  count: number;
  amount: number;
}

/**
 * Tax liens grouped by year
 */
export interface TaxLienYearStats {
  year: number;
  count: number;
}

// ============================================
// API Query Types
// ============================================

/**
 * Tax Liens search query params
 */
export interface TaxLienSearchQuery {
  county?: string;
  status?: 'active' | 'released';
  year?: number;
  communityId?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  perPage?: number;
  sortBy?: 'amount' | 'year' | 'filedDate' | 'county';
  sortOrder?: 'asc' | 'desc';
}
