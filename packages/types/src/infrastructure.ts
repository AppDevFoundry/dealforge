/**
 * Infrastructure Intelligence types
 *
 * Types for CCN water/sewer service areas and FEMA flood zones.
 */

// ============================================
// CCN Service Area Types
// ============================================

export type CcnServiceType = 'water' | 'sewer' | 'both';

export interface CcnAreaProperties {
  id: string;
  ccnNumber: string;
  utilityName: string;
  serviceType: CcnServiceType;
  county: string;
}

// ============================================
// Flood Zone Types
// ============================================

export type FloodZoneCode = 'A' | 'AE' | 'AH' | 'AO' | 'AR' | 'A99' | 'V' | 'VE' | 'X' | 'D';

export type FloodRiskLevel = 'high' | 'moderate' | 'low' | 'undetermined';

/**
 * FEMA high-risk flood zone codes (1% annual chance of flooding)
 */
export const HIGH_RISK_ZONES: FloodZoneCode[] = ['A', 'AE', 'AH', 'AO', 'AR', 'A99', 'V', 'VE'];

export interface FloodZoneProperties {
  id: string;
  zoneCode: FloodZoneCode;
  zoneDescription: string | null;
  county: string;
  riskLevel: FloodRiskLevel;
}

// ============================================
// GeoJSON Types
// ============================================

export interface GeoJSONFeature<P = Record<string, unknown>> {
  type: 'Feature';
  geometry: GeoJSONGeometry;
  properties: P;
}

export interface GeoJSONGeometry {
  type: 'Polygon' | 'MultiPolygon' | 'Point';
  coordinates: number[][][] | number[][][][] | number[];
}

export interface GeoJSONFeatureCollection<P = Record<string, unknown>> {
  type: 'FeatureCollection';
  features: GeoJSONFeature<P>[];
}

// ============================================
// Infrastructure Summary (check-point response)
// ============================================

export interface InfrastructureSummary {
  ccnAreas: CcnAreaProperties[];
  floodZone: FloodZoneProperties | null;
  hasWaterService: boolean;
  hasSewerService: boolean;
  floodRiskLevel: FloodRiskLevel | null;
  isHighRiskFlood: boolean;
}

// ============================================
// Layer Visibility (UI state)
// ============================================

export interface InfrastructureLayerVisibility {
  communities: boolean;
  waterCcn: boolean;
  sewerCcn: boolean;
  floodZonesHigh: boolean;
  floodZonesModerate: boolean;
}

// ============================================
// API Query Types
// ============================================

export interface CcnAreaQuery {
  bbox: string; // 'minLng,minLat,maxLng,maxLat'
  serviceType?: CcnServiceType;
}

export interface FloodZoneQuery {
  bbox: string;
  county?: string;
  highRiskOnly?: boolean;
}

export interface InfrastructureCheckQuery {
  lat: number;
  lng: number;
}
