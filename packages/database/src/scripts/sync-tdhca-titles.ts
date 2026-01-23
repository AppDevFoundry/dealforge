/**
 * TDHCA Title/Ownership Records Sync Script
 *
 * Parses TDHCA MHWeb title download CSVs and upserts into mh_ownership_records table.
 *
 * Usage:
 *   pnpm --filter @dealforge/database sync:tdhca:titles path/to/TTL66948.csv
 *
 * Data source: TDHCA MHWeb - download_title_info.jsp
 */

import { config } from 'dotenv';
import { createId } from '@paralleldrive/cuid2';
import { neon } from '@neondatabase/serverless';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Load environment
config({ path: '../../.env.local' });

/**
 * CSV column → DB column mapping
 */
interface TitleRecord {
  certificateNumber: string;
  label: string;
  serialNumber: string;
  manufacturerName: string;
  model: string;
  manufactureDate: string;
  sections: number | null;
  squareFeet: number | null;
  saleDate: string;
  sellerName: string;
  ownerName: string;
  ownerAddress: string;
  ownerCity: string;
  ownerState: string;
  ownerZip: string;
  installCounty: string;
  installAddress: string;
  installCity: string;
  installState: string;
  installZip: string;
  windZone: string;
  issueDate: string;
  electionType: string;
  lienHolder1: string;
  lienDate1: string;
}

/**
 * Parse a CSV line respecting quoted fields
 */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote
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
 * Map CSV row to TitleRecord
 */
export function mapTitleRow(headers: string[], values: string[]): TitleRecord | null {
  const get = (name: string): string => {
    const idx = headers.indexOf(name);
    return idx >= 0 ? (values[idx] || '').trim() : '';
  };

  const certNum = get('CertNum');
  if (!certNum) return null;

  const sections = parseInt(get('Sections'), 10);
  const sqrFeet = parseInt(get('SqrFeet'), 10);

  return {
    certificateNumber: certNum,
    label: get('Label1'),
    serialNumber: get('Serial1'),
    manufacturerName: get('ManufName'),
    model: get('Model'),
    manufactureDate: get('ManufDate').trim(),
    sections: isNaN(sections) ? null : sections,
    squareFeet: isNaN(sqrFeet) ? null : sqrFeet,
    saleDate: get('SaleDate').trim(),
    sellerName: get('SellerName'),
    ownerName: get('OwnerName'),
    ownerAddress: get('OwnerAddr1'),
    ownerCity: get('OwnerCity'),
    ownerState: get('OwnerState'),
    ownerZip: get('OwnerZip'),
    installCounty: get('InstallCounty'),
    installAddress: get('Loc_Addr1'),
    installCity: get('Loc_City'),
    installState: get('Loc_State'),
    installZip: get('Loc_Zipcode'),
    windZone: get('WindZone'),
    issueDate: get('Issue_Date').trim(),
    electionType: get('Election_Type'),
    lienHolder1: get('LienName1_1'),
    lienDate1: get('LienDate1').trim(),
  };
}

async function syncTdhcaTitles(csvPath: string) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  if (!csvPath) {
    console.error('Usage: sync:tdhca:titles <path-to-csv>');
    process.exit(1);
  }

  const resolvedPath = path.resolve(csvPath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const sourceFile = path.basename(resolvedPath);

  console.log(`Loading TDHCA title records from: ${sourceFile}`);

  const content = fs.readFileSync(resolvedPath, 'utf-8');
  const lines = content.split('\n').filter((line) => line.trim());

  if (lines.length < 2) {
    console.error('CSV file has no data rows');
    process.exit(1);
  }

  // Parse headers
  const headerLine = lines[0]!;
  const headers = parseCsvLine(headerLine);
  console.log(`Headers found: ${headers.length} columns`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  const countiesSeen = new Map<string, number>();

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]!);
    const record = mapTitleRow(headers, values);

    if (!record) {
      skipped++;
      continue;
    }

    // Track counties
    if (record.installCounty) {
      countiesSeen.set(
        record.installCounty,
        (countiesSeen.get(record.installCounty) || 0) + 1
      );
    }

    const id = `mho_${createId()}`;

    try {
      await sql`
        INSERT INTO mh_ownership_records (
          id, certificate_number, label, serial_number, manufacturer_name, model,
          manufacture_date, sections, square_feet, sale_date, seller_name,
          owner_name, owner_address, owner_city, owner_state, owner_zip,
          install_county, install_address, install_city, install_state, install_zip,
          wind_zone, issue_date, election_type, lien_holder_1, lien_date_1,
          source_file, created_at
        ) VALUES (
          ${id}, ${record.certificateNumber}, ${record.label}, ${record.serialNumber},
          ${record.manufacturerName}, ${record.model}, ${record.manufactureDate},
          ${record.sections}, ${record.squareFeet}, ${record.saleDate}, ${record.sellerName},
          ${record.ownerName}, ${record.ownerAddress}, ${record.ownerCity},
          ${record.ownerState}, ${record.ownerZip}, ${record.installCounty},
          ${record.installAddress}, ${record.installCity}, ${record.installState},
          ${record.installZip}, ${record.windZone}, ${record.issueDate},
          ${record.electionType}, ${record.lienHolder1}, ${record.lienDate1},
          ${sourceFile}, NOW()
        )
        ON CONFLICT (certificate_number) DO NOTHING
      `;
      inserted++;

      if (inserted % 100 === 0) {
        console.log(`  Inserted ${inserted} records...`);
      }
    } catch (error) {
      errors++;
      if (errors <= 5) {
        console.error(`  Error inserting ${record.certificateNumber}:`, error);
      }
    }
  }

  console.log(`\nSync complete:`);
  console.log(`  Total rows parsed: ${lines.length - 1}`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped (duplicates/empty): ${skipped + (lines.length - 1 - inserted - skipped - errors)}`);
  console.log(`  Errors: ${errors}`);
  console.log(`\nRecords by county:`);
  for (const [county, count] of [...countiesSeen.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${county}: ${count}`);
  }

  // Show total count
  const result = await sql`SELECT COUNT(*) as count FROM mh_ownership_records`;
  console.log(`\nTotal ownership records in database: ${result[0]?.count || 0}`);
}

// Run if called directly
const csvPath = process.argv[2] || '';
syncTdhcaTitles(csvPath).catch(console.error);
