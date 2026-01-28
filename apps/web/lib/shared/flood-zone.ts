/**
 * Flood zone lookup utilities
 */

import { neon } from '@neondatabase/serverless';

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

export interface FloodZoneResult {
  zoneCode: string;
  zoneDescription?: string | null;
  isHighRisk: boolean;
}

// High-risk flood zone codes (Special Flood Hazard Areas)
const HIGH_RISK_ZONES = ['A', 'AE', 'AH', 'AO', 'AR', 'A99', 'V', 'VE'];

/**
 * Check flood zone for a given location
 */
export async function checkFloodZone(
  latitude: number,
  longitude: number
): Promise<FloodZoneResult | null> {
  const sql = getSql();

  try {
    const floodZones = (await sql`
      SELECT zone_code, zone_description
      FROM flood_zones
      WHERE ST_Contains(
        boundary::geometry,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
      )
      LIMIT 1
    `) as Array<{ zone_code: string; zone_description: string | null }>;

    if (floodZones.length === 0) {
      return null;
    }

    const zone = floodZones[0]!;
    const zoneCode = zone.zone_code.toUpperCase();
    const isHighRisk = HIGH_RISK_ZONES.some((hz) => zoneCode === hz || zoneCode.startsWith(hz));

    return {
      zoneCode: zone.zone_code,
      zoneDescription: zone.zone_description,
      isHighRisk,
    };
  } catch (error) {
    console.warn('Flood zone check failed:', error);
    return null;
  }
}

/**
 * Get flood zone description
 */
export function getFloodZoneDescription(zoneCode: string): string {
  const descriptions: Record<string, string> = {
    A: 'High risk - 1% annual chance flood (100-year flood)',
    AE: 'High risk - 1% annual chance flood with base flood elevations',
    AH: 'High risk - 1% annual chance shallow flooding (1-3 feet)',
    AO: 'High risk - 1% annual chance sheet flow flooding',
    AR: 'High risk - Flood control system under restoration',
    A99: 'High risk - 1% annual chance flood (levee system under construction)',
    V: 'High risk - Coastal flood zone with wave action',
    VE: 'High risk - Coastal flood zone with base flood elevations',
    B: 'Moderate risk - 0.2% annual chance flood (500-year flood)',
    X: 'Low to moderate risk - Outside 1% annual chance flood',
    C: 'Minimal risk - Areas outside flood hazard zones',
    D: 'Undetermined risk - No flood hazard analysis performed',
  };

  const upperCode = zoneCode.toUpperCase();
  for (const [key, desc] of Object.entries(descriptions)) {
    if (upperCode === key || upperCode.startsWith(key)) {
      return desc;
    }
  }

  return 'Unknown flood zone classification';
}
