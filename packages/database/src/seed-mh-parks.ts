/**
 * MH Parks seed script
 *
 * Creates sample data for MH Parks feature:
 * - 5 Texas counties (Bexar, Hidalgo, Cameron, Nueces, Travis)
 * - 10-20 MH communities per county (50-100 total)
 * - 12 months of titling activity per county
 *
 * Usage: pnpm db:seed:mh-parks
 */

import { config } from 'dotenv';

// Load .env.local from the root of the monorepo
config({ path: '../../.env.local' });

import { getDb } from './client';
import { texasCounties, mhCommunities, mhTitlings } from './schema';

// Check for --force flag
const forceReseed = process.argv.includes('--force');

// Texas counties to seed (initial focus areas)
const TEXAS_COUNTIES = [
  {
    name: 'Bexar',
    fipsCode: '48029',
    region: 'South Central',
    centerLat: 29.4241,
    centerLng: -98.4936,
  },
  {
    name: 'Hidalgo',
    fipsCode: '48215',
    region: 'Rio Grande Valley',
    centerLat: 26.245,
    centerLng: -98.232,
  },
  {
    name: 'Cameron',
    fipsCode: '48061',
    region: 'Rio Grande Valley',
    centerLat: 26.0545,
    centerLng: -97.5425,
  },
  {
    name: 'Nueces',
    fipsCode: '48355',
    region: 'Coastal Bend',
    centerLat: 27.7581,
    centerLng: -97.4714,
  },
  {
    name: 'Travis',
    fipsCode: '48453',
    region: 'Central Texas',
    centerLat: 30.2672,
    centerLng: -97.7431,
  },
];

// Property types for MH communities
const PROPERTY_TYPES = ['all_ages', 'senior_55+', 'family'] as const;

// Sample park name prefixes and suffixes
const PARK_NAME_PREFIXES = [
  'Sunny',
  'Shady',
  'Oak',
  'Pine',
  'Willow',
  'Cedar',
  'Maple',
  'Palm',
  'Desert',
  'Valley',
  'River',
  'Lake',
  'Mountain',
  'Golden',
  'Silver',
  'Blue',
  'Green',
  'Crystal',
  'Diamond',
  'Sunrise',
];

const PARK_NAME_SUFFIXES = [
  'Estates',
  'Village',
  'Park',
  'Community',
  'Manor',
  'Gardens',
  'Terrace',
  'Heights',
  'Meadows',
  'Ranch',
  'Oaks',
  'Pines',
  'Haven',
  'Place',
  'Acres',
];

// Cities by county
const CITIES_BY_COUNTY: Record<string, string[]> = {
  Bexar: ['San Antonio', 'Converse', 'Universal City', 'Live Oak', 'Schertz'],
  Hidalgo: ['McAllen', 'Edinburg', 'Mission', 'Pharr', 'Weslaco'],
  Cameron: ['Brownsville', 'Harlingen', 'San Benito', 'Los Fresnos', 'Port Isabel'],
  Nueces: ['Corpus Christi', 'Portland', 'Robstown', 'Bishop', 'Agua Dulce'],
  Travis: ['Austin', 'Pflugerville', 'Manor', 'Del Valle', 'Jonestown'],
};

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
  // biome-ignore lint/style/noNonNullAssertion: array is always non-empty in our usage
  return arr[idx]!;
}

/**
 * Generate a unique park name
 */
function generateParkName(usedNames: Set<string>): string {
  let attempts = 0;
  while (attempts < 100) {
    const prefix = randomElement(PARK_NAME_PREFIXES);
    const suffix = randomElement(PARK_NAME_SUFFIXES);
    const name = `${prefix} ${suffix}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
    attempts++;
  }
  // Fallback with random number
  return `MH Community ${Math.floor(Math.random() * 10000)}`;
}

/**
 * Generate sample MH communities for a county
 */
function generateCommunities(
  countyName: string,
  centerLat: number,
  centerLng: number,
  count: number,
  usedNames: Set<string>
) {
  const cities = CITIES_BY_COUNTY[countyName] || [countyName];
  const communities = [];

  for (let i = 0; i < count; i++) {
    const city = randomElement(cities);
    const name = generateParkName(usedNames);
    const lotCount = randomInRange(20, 300);
    const occupancy = randomInRange(70, 98) / 100;

    // Generate coordinates within ~0.5 degree of county center
    const lat = centerLat + (Math.random() - 0.5) * 0.5;
    const lng = centerLng + (Math.random() - 0.5) * 0.5;

    communities.push({
      name,
      address: `${randomInRange(100, 9999)} ${randomElement(['Main', 'Oak', 'Elm', 'First', 'Second', 'Third', 'Park', 'Lake', 'River'])} ${randomElement(['Street', 'Avenue', 'Road', 'Drive', 'Lane', 'Boulevard'])}`,
      city,
      county: countyName,
      state: 'TX',
      zipCode: `${randomInRange(78000, 79999)}`,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
      lotCount,
      estimatedOccupancy: occupancy,
      propertyType: randomElement(PROPERTY_TYPES),
      ownerName:
        Math.random() > 0.3
          ? `${randomElement(['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Martinez', 'Rodriguez', 'Davis', 'Miller'])} ${randomElement(['Properties', 'Holdings', 'Investments', 'Management', 'Group', 'LLC'])}`
          : null,
      source: 'seed',
      sourceUpdatedAt: new Date(),
      metadata: {},
    });
  }

  return communities;
}

/**
 * Generate 12 months of titling activity for a county
 */
function generateTitlingActivity(countyName: string) {
  const titlings = [];
  const now = new Date();

  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const month = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);

    // Generate realistic-looking data with some variation
    const baseNewTitles = randomInRange(15, 80);
    const baseTransfers = randomInRange(30, 150);

    // Add seasonal variation (more activity in spring/summer)
    const monthNum = month.getMonth();
    const seasonalMultiplier =
      monthNum >= 3 && monthNum <= 8 ? 1 + Math.random() * 0.2 : 1 - Math.random() * 0.1;

    titlings.push({
      county: countyName,
      month,
      newTitles: Math.round(baseNewTitles * seasonalMultiplier),
      transfers: Math.round(baseTransfers * seasonalMultiplier),
      totalActive: randomInRange(2000, 15000),
      source: 'seed',
    });
  }

  return titlings;
}

async function seed() {
  console.log('🏘️  Starting MH Parks seed...\n');

  const db = getDb();

  // Check if data already exists
  const existingCounties = await db.query.texasCounties.findMany();

  if (existingCounties.length > 0) {
    if (forceReseed) {
      console.log('🗑️  Deleting existing MH Parks data (--force flag)...');

      // Delete in order to avoid FK issues (even though we don't have FKs, good practice)
      await db.delete(mhTitlings);
      await db.delete(mhCommunities);
      await db.delete(texasCounties);

      console.log('  ✓ Deleted existing MH Parks data\n');
    } else {
      console.log('⚠️  MH Parks data already exists. Skipping seed to avoid duplicates.');
      console.log('   Use --force flag to delete and re-seed.\n');
      process.exit(0);
    }
  }

  // Seed Texas counties
  console.log('Creating Texas counties...');
  for (const county of TEXAS_COUNTIES) {
    await db.insert(texasCounties).values({
      name: county.name,
      fipsCode: county.fipsCode,
      region: county.region,
      centerLat: county.centerLat,
      centerLng: county.centerLng,
      isActive: true,
    });
    console.log(`  ✓ Created county: ${county.name}`);
  }

  // Seed MH communities
  console.log('\nCreating MH communities...');
  const usedNames = new Set<string>();
  let totalCommunities = 0;

  for (const county of TEXAS_COUNTIES) {
    const communityCount = randomInRange(10, 20);
    const communities = generateCommunities(
      county.name,
      county.centerLat,
      county.centerLng,
      communityCount,
      usedNames
    );

    for (const community of communities) {
      await db.insert(mhCommunities).values(community);
    }

    totalCommunities += communities.length;
    console.log(`  ✓ Created ${communities.length} communities in ${county.name} County`);
  }

  console.log(`  Total communities created: ${totalCommunities}`);

  // Seed titling activity
  console.log('\nCreating titling activity data...');
  let totalTitlings = 0;

  for (const county of TEXAS_COUNTIES) {
    const titlings = generateTitlingActivity(county.name);

    for (const titling of titlings) {
      await db.insert(mhTitlings).values(titling);
    }

    totalTitlings += titlings.length;
    console.log(`  ✓ Created ${titlings.length} months of titling data for ${county.name} County`);
  }

  console.log(`  Total titling records created: ${totalTitlings}`);

  console.log('\n✅ MH Parks seed completed successfully!\n');
  console.log('Summary:');
  console.log(`  - ${TEXAS_COUNTIES.length} Texas counties`);
  console.log(`  - ${totalCommunities} MH communities`);
  console.log(`  - ${totalTitlings} titling activity records`);
  console.log('\n');

  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ MH Parks seed failed:', error);
  process.exit(1);
});
