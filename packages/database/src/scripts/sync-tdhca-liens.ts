/**
 * TDHCA Tax Lien Records Sync Script
 *
 * Parses TDHCA MHWeb tax lien download CSVs and upserts into mh_tax_liens table.
 *
 * Usage:
 *   pnpm --filter @dealforge/database sync:tdhca:liens path/to/TAX66949.csv
 *
 * Data source: TDHCA MHWeb - taxlien_download.jsp
 */

import { config } from 'dotenv';
import { createId } from '@paralleldrive/cuid2';
import { neon } from '@neondatabase/serverless';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Load environment
config({ path: '../../.env.local' });

/**
 * DB record for tax liens
 */
interface TaxLienRecord {
  taxRollNumber: string;
  payerName: string;
  payerAddress: string;
  payerCity: string;
  label: string;
  serialNumber: string;
  county: string;
  taxUnitId: string;
  taxUnitName: string;
  taxYear: number | null;
  lienDate: string;
  releaseDate: string;
  taxAmount: number | null;
  status: string;
}

/**
 * Parse a CSV line respecting quoted fields
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Parse the PayerAddr3 field which contains "CITY, ST ZIP"
 */
function parsePayerCityFromAddr3(addr3: string): string {
  if (!addr3) return '';
  // Format: "SAN ANTONIO, TX 78223"
  const commaIdx = addr3.indexOf(',');
  if (commaIdx >= 0) {
    return addr3.substring(0, commaIdx).trim();
  }
  return addr3.trim();
}

/**
 * Map CSV row to TaxLienRecord
 */
export function mapLienRow(headers: string[], values: string[]): TaxLienRecord | null {
  const get = (name: string): string => {
    const idx = headers.indexOf(name);
    return idx >= 0 ? (values[idx] || '').trim() : '';
  };

  const taxRollNumber = get('TaxRollNum');
  if (!taxRollNumber) return null;

  const taxYear = parseInt(get('TaxYear'), 10);
  const taxAmountStr = get('Tax Amount').replace(/[,$]/g, '');
  const taxAmount = parseFloat(taxAmountStr);
  const releaseDate = get('ReleaseDate');

  return {
    taxRollNumber,
    payerName: get('PayerName'),
    payerAddress: get('PayerAddr1'),
    payerCity: parsePayerCityFromAddr3(get('PayerAddr3')),
    label: get('Label1'),
    serialNumber: get('Serial1'),
    county: get('County'),
    taxUnitId: get('TaxUnitID'),
    taxUnitName: get('TaxUnitName'),
    taxYear: isNaN(taxYear) ? null : taxYear,
    lienDate: get('LienDate'),
    releaseDate,
    taxAmount: isNaN(taxAmount) ? null : taxAmount,
    status: releaseDate ? 'released' : 'active',
  };
}

async function syncTdhcaLiens(csvPath: string) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  if (!csvPath) {
    console.error('Usage: sync:tdhca:liens <path-to-csv>');
    process.exit(1);
  }

  const resolvedPath = path.resolve(csvPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const sourceFile = path.basename(resolvedPath);

  console.log(`Loading TDHCA tax lien records from: ${sourceFile}`);

  const content = fs.readFileSync(resolvedPath, 'utf-8');
  const lines = content.split('\n').filter((line) => line.trim());

  if (lines.length < 2) {
    console.error('CSV file has no data rows');
    process.exit(1);
  }

  // Parse headers (trim whitespace from header names)
  const headerLine = lines[0]!;
  const headers = parseCsvLine(headerLine).map((h) => h.trim());
  console.log(`Headers found: ${headers.length} columns`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  const countiesSeen = new Map<string, number>();
  let activeCount = 0;
  let releasedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]!);
    const record = mapLienRow(headers, values);

    if (!record) {
      skipped++;
      continue;
    }

    // Track counties and status
    if (record.county) {
      countiesSeen.set(record.county, (countiesSeen.get(record.county) || 0) + 1);
    }
    if (record.status === 'active') activeCount++;
    else releasedCount++;

    try {
      // Check if record already exists (by natural key: tax_roll_number + label + tax_year + county)
      const existing = await sql`
        SELECT id FROM mh_tax_liens
        WHERE tax_roll_number = ${record.taxRollNumber}
          AND label = ${record.label}
          AND tax_year = ${record.taxYear}
          AND county = ${record.county}
        LIMIT 1
      `;

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      const id = `mhl_${createId()}`;
      await sql`
        INSERT INTO mh_tax_liens (
          id, tax_roll_number, payer_name, payer_address, payer_city,
          label, serial_number, county, tax_unit_id, tax_unit_name,
          tax_year, lien_date, release_date, tax_amount, status,
          source_file, created_at
        ) VALUES (
          ${id}, ${record.taxRollNumber}, ${record.payerName}, ${record.payerAddress},
          ${record.payerCity}, ${record.label}, ${record.serialNumber}, ${record.county},
          ${record.taxUnitId}, ${record.taxUnitName}, ${record.taxYear},
          ${record.lienDate}, ${record.releaseDate || null}, ${record.taxAmount},
          ${record.status}, ${sourceFile}, NOW()
        )
      `;
      inserted++;

      if (inserted % 500 === 0) {
        console.log(`  Inserted ${inserted} records...`);
      }
    } catch (error) {
      errors++;
      if (errors <= 5) {
        console.error(`  Error inserting lien ${record.taxRollNumber}:`, error);
      }
    }
  }

  console.log(`\nSync complete:`);
  console.log(`  Total rows parsed: ${lines.length - 1}`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped (empty): ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Status: ${activeCount} active, ${releasedCount} released`);
  console.log(`\nRecords by county:`);
  for (const [county, count] of [...countiesSeen.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${county}: ${count}`);
  }

  // Show total count
  const result = await sql`SELECT COUNT(*) as count FROM mh_tax_liens`;
  console.log(`\nTotal tax lien records in database: ${result[0]?.count || 0}`);
}

// Run if called directly
const csvPath = process.argv[2] || '';
syncTdhcaLiens(csvPath).catch(console.error);
