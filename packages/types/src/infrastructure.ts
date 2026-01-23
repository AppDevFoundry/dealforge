/**
 * Infrastructure types for CCN utility areas and FEMA flood zones
 */

// ============================================
// Service Types
// ============================================

export type CcnServiceType = 'water' | 'sewer' | 'both';

// ============================================
// Flood Risk Levels
// ============================================

export type FloodRiskLevel = 'high' | 'moderate' | 'low' | 'undetermined';

/**
 * FEMA Special Flood Hazard Area (SFHA) zone codes - high risk
 */
export const HIGH_RISK_ZONES = ['A', 'AE', 'AH', 'AO', 'AR', 'A99', 'V', 'VE'] as const;

/**
 * Moderate risk flood zones
 */
export const MODERATE_RISK_ZONES = ['B', 'X'] as const;

/**
 * Low risk flood zones
 */
export const LOW_RISK_ZONES = ['C', 'X'] as const;

// ============================================
// CCN Area Types
// ============================================

/**
 * CCN (Certificate of Convenience and Necessity) Area
 * Represents a utility service boundary in Texas
 */
export interface CcnArea {
  id: string;
  ccnNumber: string | null;
  utilityName: string;
  serviceType: CcnServiceType;
  county: string | null;
}

/**
 * CCN Area with GeoJSON geometry for map rendering
 */
export interface CcnAreaGeoJson extends CcnArea {
  geometry: GeoJSON.Polygon;
}

// ============================================
// Flood Zone Types
// ============================================

/**
 * FEMA Flood Zone
 */
export interface FloodZone {
  id: string;
  zoneCode: string;
  zoneDescription: string | null;
  county: string | null;
  riskLevel: FloodRiskLevel;
}

/**
 * Flood Zone with GeoJSON geometry for map rendering
 */
export interface FloodZoneGeoJson extends FloodZone {
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

// ============================================
// Query Types
// ============================================

/**
 * Bounding box for spatial queries [minLng, minLat, maxLng, maxLat]
 */
export type BBox = [number, number, number, number];

/**
 * CCN areas query parameters
 */
export interface CcnAreasQuery {
  bbox?: string; // "minLng,minLat,maxLng,maxLat"
  lat?: number;
  lng?: number;
  radius?: number; // in meters
  county?: string;
  serviceType?: CcnServiceType;
}

/**
 * Flood zones query parameters
 */
export interface FloodZonesQuery {
  bbox?: string;
  county?: string;
  highRiskOnly?: boolean;
}

/**
 * Point check query parameters
 */
export interface InfrastructurePointQuery {
  lat: number;
  lng: number;
}

// ============================================
// Response Types
// ============================================

/**
 * Infrastructure data at a specific point
 */
export interface InfrastructureAtPoint {
  ccnAreas: CcnArea[];
  floodZones: FloodZone[];
}

/**
 * GeoJSON Feature for CCN area
 */
export interface CcnFeature extends GeoJSON.Feature<GeoJSON.Polygon> {
  properties: CcnArea;
}

/**
 * GeoJSON Feature for flood zone
 */
export interface FloodZoneFeature extends GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> {
  properties: FloodZone;
}

/**
 * GeoJSON FeatureCollection for CCN areas
 */
export interface CcnFeatureCollection extends GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  features: CcnFeature[];
}

/**
 * GeoJSON FeatureCollection for flood zones
 */
export interface FloodZoneFeatureCollection
  extends GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon> {
  features: FloodZoneFeature[];
}

// ============================================
// Helper Functions
// ============================================

/**
 * Determine flood risk level from zone code
 */
export function getFloodRiskLevel(zoneCode: string): FloodRiskLevel {
  const code = zoneCode.toUpperCase().trim();

  // Check for high risk zones
  if (HIGH_RISK_ZONES.some((z) => code === z || code.startsWith(z))) {
    return 'high';
  }

  // Check for moderate risk (shaded X zones or B zones)
  if (code === 'B' || code === 'X SHADED' || code.includes('SHADED')) {
    return 'moderate';
  }

  // Check for low risk (unshaded X zones or C zones)
  if (code === 'C' || code === 'X' || code === 'X UNSHADED') {
    return 'low';
  }

  return 'undetermined';
}

/**
 * Parse a bbox string into a tuple
 */
export function parseBBox(bboxStr: string): BBox | null {
  const parts = bboxStr.split(',').map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) {
    return null;
  }
  return parts as BBox;
}
