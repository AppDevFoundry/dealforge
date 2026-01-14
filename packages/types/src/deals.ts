/**
 * Deal-related types
 */

export type DealType =
  | 'rental'
  | 'brrrr'
  | 'flip'
  | 'house_hack'
  | 'multifamily'
  | 'commercial'
  | 'syndication';

export type DealStatus = 'draft' | 'analyzing' | 'archived';

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
  createdAt: Date;
  updatedAt: Date;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface DealTag {
  dealId: string;
  tag: string;
}

export interface CreateDealInput {
  type: DealType;
  name: string;
  address?: string;
  inputs: Record<string, unknown>;
}

export interface UpdateDealInput {
  name?: string;
  status?: DealStatus;
  address?: string;
  inputs?: Record<string, unknown>;
  isPublic?: boolean;
}
