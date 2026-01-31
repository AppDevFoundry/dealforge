/**
 * Script to run parcel-related migrations directly
 * Run with: node scripts/run-parcel-migrations.js
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '../../.env.local' });
const fs = require('fs');
const path = require('path');

const sql = neon(process.env.DATABASE_URL);

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../src/migrations');

  // Migration 0013: Create parcels table
  console.log('\n=== Running 0013_parcels.sql ===');
  const parcelsSQL = fs.readFileSync(path.join(migrationsDir, '0013_parcels.sql'), 'utf8');
  const parcelsStatements = parcelsSQL
    .split('--> statement-breakpoint')
    .map(s => s.trim())
    .filter(s => s && !s.match(/^--/));

  for (const stmt of parcelsStatements) {
    const preview = stmt.replace(/\s+/g, ' ').substring(0, 60);
    try {
      await sql.unsafe(stmt);
      console.log('  ✓ ' + preview + '...');
    } catch(e) {
      if (e.code === '42P07' || e.code === '42710') {
        console.log('  - Already exists: ' + preview + '...');
      } else {
        console.error('  ✗ Error:', e.message);
        throw e;
      }
    }
  }

  // Migration 0014: Add parcel columns to lead_intelligence
  console.log('\n=== Running 0014_lead_intelligence_parcel.sql ===');
  const leadIntSQL = fs.readFileSync(path.join(migrationsDir, '0014_lead_intelligence_parcel.sql'), 'utf8');
  const leadIntStatements = leadIntSQL
    .split('--> statement-breakpoint')
    .map(s => s.trim())
    .filter(s => s && !s.match(/^--/));

  for (const stmt of leadIntStatements) {
    const preview = stmt.replace(/\s+/g, ' ').substring(0, 60);
    try {
      await sql.unsafe(stmt);
      console.log('  ✓ ' + preview + '...');
    } catch(e) {
      if (e.code === '42701' || e.code === '42710') {
        console.log('  - Already exists: ' + preview + '...');
      } else {
        console.error('  ✗ Error:', e.message);
        throw e;
      }
    }
  }

  console.log('\n✓ Migrations complete!');

  // Verify
  console.log('\n=== Verification ===');
  const parcelsTable = await sql`
    SELECT column_name, udt_name
    FROM information_schema.columns
    WHERE table_name = 'parcels'
    ORDER BY ordinal_position
    LIMIT 5
  `;
  console.log('Parcels table columns (first 5):', parcelsTable.map(c => c.column_name).join(', '));

  const leadIntCols = await sql`
    SELECT column_name, udt_name
    FROM information_schema.columns
    WHERE table_name = 'lead_intelligence'
      AND column_name IN ('parcel_id', 'parcel_data')
  `;
  console.log('Lead intelligence new columns:', leadIntCols.map(c => c.column_name).join(', '));
}

runMigrations().catch(e => {
  console.error('\nFailed:', e.message);
  process.exit(1);
});
