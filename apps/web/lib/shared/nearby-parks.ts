/**
 * Nearby MH parks lookup utilities
 */

import { neon } from '@neondatabase/serverless';

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

export interface NearbyPark {
  id: string;
  name: string;
  address?: string | null;
  city: string;
  county: string;
  latitude?: number | null;
  longitude?: number | null;
  distanceMiles: number;
  lotCount?: number | null;
  distressScore?: number | null;
}

/**
 * Find MH parks within a radius of a given location
 */
export async function findNearbyParks(
  latitude: number,
  longitude: number,
  radiusMiles = 10,
  limit = 10
): Promise<NearbyPark[]> {
  const sql = getSql();
  const radiusMeters = radiusMiles * 1609.34;

  try {
    const nearbyParks = await sql`
      SELECT
        id,
        name,
        address,
        city,
        county,
        latitude,
        longitude,
        lot_count,
        distress_score,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
        ) / 1609.34 as distance_miles
      FROM mh_communities
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY distance_miles
      LIMIT ${limit}
    `;

    return nearbyParks.map((park) => ({
      id: park.id as string,
      name: park.name as string,
      address: park.address as string | null,
      city: park.city as string,
      county: park.county as string,
      latitude: park.latitude ? Number(park.latitude) : null,
      longitude: park.longitude ? Number(park.longitude) : null,
      distanceMiles: Math.round((park.distance_miles as number) * 10) / 10,
      lotCount: park.lot_count ? Number(park.lot_count) : null,
      distressScore: park.distress_score ? Number(park.distress_score) : null,
    }));
  } catch (error) {
    console.warn('Nearby parks lookup failed:', error);
    return [];
  }
}

/**
 * Get insights about nearby parks
 */
export function getNearbyParksInsights(parks: NearbyPark[], radiusMiles: number): string[] {
  const insights: string[] = [];

  if (parks.length === 0) {
    insights.push(`No MH parks found within ${radiusMiles} miles`);
    return insights;
  }

  const parksWithDistress = parks.filter((p) => p.distressScore !== null);
  if (parksWithDistress.length > 0) {
    const avgDistress =
      parksWithDistress.reduce((sum, p) => sum + (p.distressScore || 0), 0) /
      parksWithDistress.length;

    insights.push(
      `Found ${parks.length} MH parks within ${radiusMiles} miles (avg distress score: ${avgDistress.toFixed(1)})`
    );

    const distressedNearby = parks.filter((p) => p.distressScore != null && p.distressScore >= 50);
    if (distressedNearby.length > 0) {
      insights.push(
        `${distressedNearby.length} nearby park(s) showing distress signals - potential acquisition targets`
      );
    }
  } else {
    insights.push(`Found ${parks.length} MH parks within ${radiusMiles} miles`);
  }

  return insights;
}
