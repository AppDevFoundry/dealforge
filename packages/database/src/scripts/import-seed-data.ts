/**
 * Import Seed Data Script
 *
 * Imports seed data JSON files to quickly reset a dev database.
 * Clears existing data in target tables before importing.
 *
 * Usage:
 *   pnpm --filter @dealforge/database seed:import         # Interactive (prompts for confirmation)
 *   pnpm --filter @dealforge/database seed:import --force # Skip confirmation
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { createId } from '@paralleldrive/cuid2';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

// Load environment
config({ path: '../../.env.local' });

interface ImportManifest {
  exportedAt: string;
  schemaVersion: string;
  counts: Record<string, number>;
  mvpCounties: string[];
  notes: string[];
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function importSeedData() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const force = process.argv.includes('--force');
  const sql = neon(databaseUrl);

  const seedDir = path.resolve(__dirname, '../../../../data/seed');
  const manifestPath = path.join(seedDir, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.error(`Seed manifest not found at: ${manifestPath}`);
    console.error('Run "pnpm --filter @dealforge/database seed:export" first.');
    process.exit(1);
  }

  const manifest: ImportManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  console.log('Import Seed Data');
  console.log('=================');
  console.log(`Seed data exported at: ${manifest.exportedAt}`);
  console.log(`Schema version: ${manifest.schemaVersion}`);
  console.log('');
  console.log('Records to import:');
  for (const [key, count] of Object.entries(manifest.counts)) {
    console.log(`  ${key}: ${count}`);
  }
  console.log('');

  if (!force) {
    const answer = await prompt('This will CLEAR existing data in these tables. Continue? (yes/no): ');
    if (answer.toLowerCase() !== 'yes') {
      console.log('Aborted.');
      process.exit(0);
    }
  }

  console.log('');
  console.log('Starting import...');

  // Import order matters due to potential FK relationships
  const importTasks = [
    { file: 'texas-counties.json', table: 'texas_counties', idPrefix: 'txc' },
    { file: 'hud-fair-market-rents.json', table: 'hud_fair_market_rents', idPrefix: 'hfr' },
    { file: 'census-demographics.json', table: 'census_demographics', idPrefix: 'cen' },
    { file: 'bls-employment.json', table: 'bls_employment', idPrefix: 'bls' },
    { file: 'mh-communities.json', table: 'mh_communities', idPrefix: 'mhc' },
    { file: 'mh-ownership-records.json', table: 'mh_ownership_records', idPrefix: 'mho' },
    { file: 'mh-tax-liens.json', table: 'mh_tax_liens', idPrefix: 'mhl' },
    { file: 'ccn-areas.json', table: 'ccn_areas', idPrefix: 'ccn' },
  ];

  for (const task of importTasks) {
    const filePath = path.join(seedDir, task.file);
    if (!fs.existsSync(filePath)) {
      console.log(`  Skipping ${task.file} (not found)`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, unknown>[];
    if (data.length === 0) {
      console.log(`  Skipping ${task.file} (empty)`);
      continue;
    }

    console.log(`\nImporting ${task.file} (${data.length} records)...`);

    // Clear existing data
    await sql`DELETE FROM ${sql(task.table)}`;
    console.log(`  Cleared ${task.table}`);

    // Import in batches
    const batchSize = 100;
    let imported = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      for (const record of batch) {
        // Generate new ID if needed (preserves original if valid)
        const id = record.id && String(record.id).startsWith(task.idPrefix)
          ? record.id
          : `${task.idPrefix}_${createId()}`;

        try {
          await importRecord(sql, task.table, { ...record, id });
          imported++;
        } catch (error) {
          // Log first few errors, then suppress
          if (imported < 5) {
            console.error(`  Error importing record:`, error);
          }
        }
      }

      // Progress update
      if ((i + batchSize) % 1000 === 0 || i + batchSize >= data.length) {
        console.log(`  Imported ${Math.min(i + batchSize, data.length)} / ${data.length}`);
      }
    }

    console.log(`  Complete: ${imported} records imported`);
  }

  console.log('\n--- Import Complete ---');
  console.log('Run "pnpm --filter @dealforge/database verify:data" to verify.');
}

/**
 * Import a single record to a table
 * Handles column name conversion from camelCase to snake_case
 */
async function importRecord(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sql: any,
  table: string,
  record: Record<string, unknown>
) {
  // Convert camelCase keys to snake_case
  const snakeRecord: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    snakeRecord[snakeKey] = value;
  }

  // Handle special cases for CCN areas (WKT geometry)
  let boundaryWkt: string | null = null;
  if (table === 'ccn_areas' && snakeRecord.boundary_wkt) {
    boundaryWkt = snakeRecord.boundary_wkt as string;
    delete snakeRecord.boundary_wkt;
  }

  // Build INSERT statement dynamically
  const columns = Object.keys(snakeRecord).filter(k => snakeRecord[k] !== undefined);
  const values = columns.map(k => snakeRecord[k]);

  // Add boundary column for CCN areas with WKT
  if (table === 'ccn_areas' && boundaryWkt) {
    columns.push('boundary');
  }

  // Use raw SQL for flexibility with different column sets
  const columnList = columns.join(', ');

  // Build placeholders, with special handling for boundary column
  const placeholders = columns.map((col, i) => {
    if (col === 'boundary' && boundaryWkt) {
      return `ST_GeomFromText($${i + 1}, 4326)::geography`;
    }
    return `$${i + 1}`;
  }).join(', ');

  // Add boundary WKT to values if present
  if (table === 'ccn_areas' && boundaryWkt) {
    values.push(boundaryWkt);
  }

  // Execute using tagged template literal with unsafe raw query
  // Note: Table names are validated against known tables list above
  await sql(`INSERT INTO ${table} (${columnList}) VALUES (${placeholders})`, values);
}

importSeedData().catch(console.error);
