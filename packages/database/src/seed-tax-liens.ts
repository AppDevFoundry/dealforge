/**
 * Tax Liens seed script
 *
 * Creates sample tax lien data for MVP counties:
 * - Mix of active/released status
 * - Various tax years (2022-2024)
 * - Different taxing entities
 * - Range of amounts ($500 - $5,000)
 * - Some linked to existing communities
 *
 * Usage: pnpm db:seed:tax-liens
 */

import { config } from 'dotenv';

// Load .env.local from the root of the monorepo
config({ path: '../../.env.local' });

import { getDb } from './client';
import { mhTaxLiens } from './schema';

// Check for --force flag
const forceReseed = process.argv.includes('--force');

// MVP Texas counties
const COUNTIES = ['Bexar', 'Hidalgo', 'Cameron', 'Nueces', 'Travis'];

// Taxing entities by county
const TAXING_ENTITIES: Record<string, string[]> = {
  Bexar: [
    'City of San Antonio',
    'Bexar County',
    'Northside ISD',
    'San Antonio ISD',
    'Judson ISD',
    'Bexar County ESD #2',
  ],
  Hidalgo: [
    'City of McAllen',
    'City of Edinburg',
    'Hidalgo County',
    'McAllen ISD',
    'Edinburg CISD',
    'Hidalgo County Drainage District',
  ],
  Cameron: [
    'City of Brownsville',
    'City of Harlingen',
    'Cameron County',
    'Brownsville ISD',
    'Harlingen CISD',
    'Cameron County MUD #1',
  ],
  Nueces: [
    'City of Corpus Christi',
    'Nueces County',
    'Corpus Christi ISD',
    'Flour Bluff ISD',
    'Del Mar College',
  ],
  Travis: [
    'City of Austin',
    'Travis County',
    'Austin ISD',
    'Pflugerville ISD',
    'Manor ISD',
    'Travis County ESD #1',
  ],
};

// Status options
const STATUSES = ['active', 'released'] as const;

// Tax years
const TAX_YEARS = [2022, 2023, 2024];

/**
 * Generate a random number in range (inclusive)
 */
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random element from array
 */
function randomElement<T>(arr: readonly T[]): T {
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx]!;
}

/**
 * Generate a random serial number
 */
function generateSerialNumber(): string {
  const prefix = randomElement(['TEX', 'TXS', 'HWC', 'FLW', 'CAV', 'CLT']);
  const numbers = String(randomInRange(100000, 999999));
  const suffix = String.fromCharCode(65 + randomInRange(0, 25));
  return `${prefix}${numbers}${suffix}`;
}

/**
 * Generate a HUD label number
 */
function generateHudLabel(): string | null {
  // ~70% have HUD labels
  if (Math.random() > 0.7) return null;
  const prefix = randomElement(['TEX', 'TXS', 'NTA']);
  const year = randomInRange(85, 24);
  const seq = randomInRange(1000, 9999);
  return `${prefix}${year.toString().padStart(2, '0')}${seq}`;
}

/**
 * Generate a random date within a range
 */
function randomDate(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  return new Date(startTime + Math.random() * (endTime - startTime));
}

/**
 * Generate tax liens for a county
 */
function generateTaxLiens(
  countyName: string,
  count: number,
  communityIds: string[]
): Array<{
  serialNumber: string;
  hudLabel: string | null;
  county: string;
  taxingEntity: string;
  amount: number;
  year: number;
  status: 'active' | 'released';
  filedDate: Date;
  releasedDate: Date | null;
  communityId: string | null;
  sourceUpdatedAt: Date;
}> {
  const liens = [];
  const entities = TAXING_ENTITIES[countyName] || [`${countyName} County`];

  for (let i = 0; i < count; i++) {
    const year = randomElement(TAX_YEARS);
    const status = randomElement(STATUSES);
    const filedDate = randomDate(new Date(year, 0, 1), new Date(year, 11, 31));

    // For released liens, set a release date 1-12 months after filing
    let releasedDate: Date | null = null;
    if (status === 'released') {
      const monthsLater = randomInRange(1, 12);
      releasedDate = new Date(filedDate);
      releasedDate.setMonth(releasedDate.getMonth() + monthsLater);
      // Cap at today
      if (releasedDate > new Date()) {
        releasedDate = new Date();
      }
    }

    // ~20% of liens linked to a community (if communities exist)
    let communityId: string | null = null;
    if (communityIds.length > 0 && Math.random() < 0.2) {
      communityId = randomElement(communityIds);
    }

    liens.push({
      serialNumber: generateSerialNumber(),
      hudLabel: generateHudLabel(),
      county: countyName,
      taxingEntity: randomElement(entities),
      amount: randomInRange(500, 5000),
      year,
      status,
      filedDate,
      releasedDate,
      communityId,
      sourceUpdatedAt: new Date(),
    });
  }

  return liens;
}

async function seed() {
  console.log('🏛️  Starting Tax Liens seed...\n');

  const db = getDb();

  // Check if data already exists
  const existingLiens = await db.query.mhTaxLiens.findMany({ limit: 1 });

  if (existingLiens.length > 0) {
    if (forceReseed) {
      console.log('🗑️  Deleting existing tax liens data (--force flag)...');
      await db.delete(mhTaxLiens);
      console.log('  ✓ Deleted existing tax liens data\n');
    } else {
      console.log('⚠️  Tax liens data already exists. Skipping seed to avoid duplicates.');
      console.log('   Use --force flag to delete and re-seed.\n');
      process.exit(0);
    }
  }

  // Get existing communities by county for linking
  const communities = await db.query.mhCommunities.findMany({
    columns: { id: true, county: true },
  });

  const communitiesByCounty: Record<string, string[]> = {};
  for (const community of communities) {
    if (!communitiesByCounty[community.county]) {
      communitiesByCounty[community.county] = [];
    }
    communitiesByCounty[community.county]!.push(community.id);
  }

  // Generate tax liens for each county
  console.log('Creating tax liens...');
  let totalLiens = 0;
  let linkedLiens = 0;

  for (const county of COUNTIES) {
    const communityIds = communitiesByCounty[county] || [];
    const lienCount = randomInRange(25, 45);
    const liens = generateTaxLiens(county, lienCount, communityIds);

    for (const lien of liens) {
      await db.insert(mhTaxLiens).values(lien);
      if (lien.communityId) linkedLiens++;
    }

    totalLiens += liens.length;
    const activeCount = liens.filter((l) => l.status === 'active').length;
    console.log(
      `  ✓ Created ${liens.length} liens in ${county} County (${activeCount} active, ${liens.length - activeCount} released)`
    );
  }

  console.log('\n✅ Tax Liens seed completed successfully!\n');
  console.log('Summary:');
  console.log(`  - ${totalLiens} total tax liens`);
  console.log(`  - ${linkedLiens} liens linked to communities`);
  console.log(`  - ${COUNTIES.length} counties`);
  console.log('\n');

  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Tax Liens seed failed:', error);
  process.exit(1);
});
