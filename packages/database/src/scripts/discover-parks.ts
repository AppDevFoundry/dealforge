/**
 * MH Park Discovery Script
 *
 * Clusters ownership records by normalized install address to discover
 * MH parks/communities and merges them into the mh_communities table.
 *
 * Algorithm:
 * 1. Query all ownership records grouped by normalized address + city + county
 * 2. Filter clusters with count >= 5 (high confidence park)
 * 3. Insert new parks or update existing if our estimate is higher
 * 4. Filter out known retailer lots
 *
 * Usage:
 *   pnpm --filter @dealforge/database discover:parks [--min-units=5] [--county=BEXAR]
 */

import { config } from 'dotenv';
import { createId } from '@paralleldrive/cuid2';
import { neon } from '@neondatabase/serverless';
import { normalizeStreetAddress } from './utils/normalize-address';

// Load environment
config({ path: '../../.env.local' });

// Known retailer/dealer name patterns to exclude
const RETAILER_PATTERNS = [
  /\bHOMES?\b.*\bINC\b/i,
  /\bHOUSING\b.*\bINC\b/i,
  /\bFACTORY\s+DIRECT\b/i,
  /\bMANUFACTUR/i,
  /\bDEALER/i,
  /\bSALES\s+CENTER/i,
  /\bPALM\s+HARBOR\s+VILLAGE/i,
  /\bCLAYTON\s+HOMES/i,
  /\bOAKWOOD\s+HOMES/i,
  /\bFLEETWOOD\s+HOMES/i,
  /\bCHAMPION\s+HOMES/i,
  /\bSOUTHERN\s+ENERGY/i,
  /\bCMH\s+HOMES/i,
  /\bTEXAS\s+PREMIER\b/i,
];

/**
 * Check if a seller name matches known retailer patterns
 */
function isRetailerName(name: string): boolean {
  if (!name) return false;
  return RETAILER_PATTERNS.some((pattern) => pattern.test(name));
}

interface AddressCluster {
  normalizedAddress: string;
  installCity: string;
  installCounty: string;
  installState: string;
  installZip: string;
  unitCount: number;
  rawAddresses: string[];
  sellerNames: string[];
  ownerNames: string[];
}

/**
 * Parse command-line arguments
 */
function parseArgs(): { minUnits: number; county: string | null } {
  const args = process.argv.slice(2);
  let minUnits = 5;
  let county: string | null = null;

  for (const arg of args) {
    if (arg.startsWith('--min-units=')) {
      minUnits = parseInt(arg.split('=')[1] || '5', 10);
    } else if (arg.startsWith('--county=')) {
      county = (arg.split('=')[1] || '').toUpperCase();
    }
  }

  return { minUnits, county };
}

async function discoverParks() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const { minUnits, county } = parseArgs();

  console.log('MH Park Discovery');
  console.log('==================');
  console.log(`  Min units threshold: ${minUnits}`);
  console.log(`  County filter: ${county || 'all'}`);
  console.log('');

  // Query all ownership records with install addresses
  const rows = county
    ? await sql`
        SELECT install_address, install_city, install_county, install_state,
               install_zip, seller_name, owner_name
        FROM mh_ownership_records
        WHERE install_address IS NOT NULL
          AND install_address != ''
          AND UPPER(install_county) = ${county}
      `
    : await sql`
        SELECT install_address, install_city, install_county, install_state,
               install_zip, seller_name, owner_name
        FROM mh_ownership_records
        WHERE install_address IS NOT NULL
          AND install_address != ''
      `;

  console.log(`Total ownership records with addresses: ${rows.length}`);

  // Cluster by normalized address + city + county
  const clusters = new Map<string, AddressCluster>();

  for (const row of rows) {
    const addr = row.install_address as string;
    const city = ((row.install_city as string) || '').toUpperCase().trim();
    const countyName = ((row.install_county as string) || '').toUpperCase().trim();
    const state = ((row.install_state as string) || 'TX').toUpperCase().trim();
    const zip = ((row.install_zip as string) || '').trim();

    const normalized = normalizeStreetAddress(addr);
    if (!normalized) continue;

    const key = `${normalized}|${city}|${countyName}`;

    if (!clusters.has(key)) {
      clusters.set(key, {
        normalizedAddress: normalized,
        installCity: city,
        installCounty: countyName,
        installState: state,
        installZip: zip,
        unitCount: 0,
        rawAddresses: [],
        sellerNames: [],
        ownerNames: [],
      });
    }

    const cluster = clusters.get(key)!;
    cluster.unitCount++;
    if (addr && !cluster.rawAddresses.includes(addr)) {
      cluster.rawAddresses.push(addr);
    }
    const seller = ((row.seller_name as string) || '').trim();
    if (seller && !cluster.sellerNames.includes(seller)) {
      cluster.sellerNames.push(seller);
    }
    const owner = ((row.owner_name as string) || '').trim();
    if (owner && !cluster.ownerNames.includes(owner)) {
      cluster.ownerNames.push(owner);
    }
  }

  // Filter to clusters with enough units
  const parkCandidates = [...clusters.values()]
    .filter((c) => c.unitCount >= minUnits)
    .sort((a, b) => b.unitCount - a.unitCount);

  console.log(`Address clusters with >= ${minUnits} units: ${parkCandidates.length}`);

  let newParks = 0;
  let updatedParks = 0;
  let retailLots = 0;

  for (const candidate of parkCandidates) {
    // Check if this looks like a retailer lot rather than a community
    // Single dominant seller with retailer-like name = retail lot
    const dominantRetailer = candidate.sellerNames.some(isRetailerName);
    const uniqueOwners = candidate.ownerNames.length;

    if (dominantRetailer && uniqueOwners <= 2) {
      retailLots++;
      console.log(`  [RETAIL LOT] ${candidate.normalizedAddress}, ${candidate.installCity} (${candidate.unitCount} units, seller: ${candidate.sellerNames[0]})`);
      continue;
    }

    // Check if a matching community already exists
    const normalizedAddr = candidate.normalizedAddress;
    const existingRows = await sql`
      SELECT id, name, lot_count, address
      FROM mh_communities
      WHERE UPPER(city) = ${candidate.installCity}
        AND UPPER(county) = ${candidate.installCounty}
        AND (
          UPPER(address) LIKE ${'%' + normalizedAddr.substring(0, Math.min(normalizedAddr.length, 20)) + '%'}
          OR UPPER(address) = ${normalizedAddr}
        )
      LIMIT 1
    `;

    if (existingRows.length > 0) {
      // Update existing park if our unit count is higher
      const existing = existingRows[0]!;
      const existingLotCount = (existing.lot_count as number) || 0;

      if (candidate.unitCount > existingLotCount) {
        await sql`
          UPDATE mh_communities
          SET lot_count = ${candidate.unitCount},
              updated_at = NOW(),
              metadata = COALESCE(metadata, '{}'::jsonb) || ${JSON.stringify({ tdhca_unit_count: candidate.unitCount, tdhca_discovery_date: new Date().toISOString() })}::jsonb
          WHERE id = ${existing.id as string}
        `;
        updatedParks++;
        console.log(`  [UPDATED] ${existing.name} — lot_count: ${existingLotCount} → ${candidate.unitCount}`);
      }
    } else {
      // Insert new park
      const id = `mhc_${createId()}`;
      // Use the first raw address as the display address (most common variant)
      const displayAddress = candidate.rawAddresses[0] || candidate.normalizedAddress;

      // Title case the city for display
      const displayCity = candidate.installCity
        .toLowerCase()
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const displayCounty = candidate.installCounty
        .toLowerCase()
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      // Use the normalized address as the park name for now
      const name = `${displayAddress}, ${displayCity}`;

      await sql`
        INSERT INTO mh_communities (
          id, name, address, city, county, state, zip_code,
          lot_count, source, metadata, created_at, updated_at
        ) VALUES (
          ${id}, ${name}, ${displayAddress}, ${displayCity}, ${displayCounty},
          ${candidate.installState || 'TX'}, ${candidate.installZip},
          ${candidate.unitCount}, 'tdhca_clustering',
          ${JSON.stringify({
            tdhca_unit_count: candidate.unitCount,
            tdhca_discovery_date: new Date().toISOString(),
            raw_address_variants: candidate.rawAddresses.slice(0, 10),
          })}::jsonb,
          NOW(), NOW()
        )
      `;
      newParks++;
      console.log(`  [NEW] ${name} — ${candidate.unitCount} units (${displayCounty} County)`);
    }
  }

  console.log(`\nDiscovery complete:`);
  console.log(`  New parks discovered: ${newParks}`);
  console.log(`  Existing parks updated: ${updatedParks}`);
  console.log(`  Retail lots excluded: ${retailLots}`);

  // Show totals
  const totalResult = await sql`
    SELECT COUNT(*) as count FROM mh_communities WHERE source = 'tdhca_clustering'
  `;
  console.log(`\nTotal TDHCA-discovered parks in database: ${totalResult[0]?.count || 0}`);
}

discoverParks().catch(console.error);
