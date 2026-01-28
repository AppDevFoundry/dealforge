/**
 * TDHCA (Texas Department of Housing and Community Affairs) record lookup utilities
 */

import { neon } from '@neondatabase/serverless';

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

export interface TdhcaMatch {
  recordId: string;
  labelOrHud: string;
  manufacturer?: string | null;
  yearMfg?: number | null;
  serialNumber?: string | null;
  hasLien?: boolean;
  lienAmount?: number | null;
  lienHolder?: string | null;
}

/**
 * Search for TDHCA records matching an address (fuzzy match)
 */
export async function searchTdhcaRecords(
  address: string,
  city?: string,
  zipCode?: string
): Promise<TdhcaMatch | null> {
  const sql = getSql();

  try {
    // Parse street number and name from address
    const addressParts = address.match(/^(\d+)\s+(.+)/);
    if (!addressParts) {
      return null;
    }

    const streetNumber = addressParts[1];
    const streetName = addressParts[2]
      ?.replace(/,.*$/, '') // Remove city, state, zip
      .replace(
        /\s+(st|street|rd|road|ave|avenue|blvd|boulevard|dr|drive|ln|lane|ct|court|way|pl|place)\.?$/i,
        ''
      ) // Remove suffix
      .trim();

    if (!streetNumber || !streetName) {
      return null;
    }

    // Build query conditions
    let rows: Array<Record<string, unknown>>;

    if (city && zipCode) {
      rows = (await sql`
        SELECT
          o.id,
          o.label_or_hud,
          o.manufacturer,
          o.year_mfg,
          o.serial_number,
          l.total_amount as lien_amount,
          l.lien_holder
        FROM mh_ownership_records o
        LEFT JOIN mh_tax_liens l ON o.label_or_hud = l.label_or_hud
        WHERE o.street_number = ${streetNumber}
          AND o.street_name ILIKE ${'%' + streetName + '%'}
          AND (o.city ILIKE ${city + '%'} OR o.zip_code = ${zipCode})
        LIMIT 1
      `) as Array<Record<string, unknown>>;
    } else if (city) {
      rows = (await sql`
        SELECT
          o.id,
          o.label_or_hud,
          o.manufacturer,
          o.year_mfg,
          o.serial_number,
          l.total_amount as lien_amount,
          l.lien_holder
        FROM mh_ownership_records o
        LEFT JOIN mh_tax_liens l ON o.label_or_hud = l.label_or_hud
        WHERE o.street_number = ${streetNumber}
          AND o.street_name ILIKE ${'%' + streetName + '%'}
          AND o.city ILIKE ${city + '%'}
        LIMIT 1
      `) as Array<Record<string, unknown>>;
    } else if (zipCode) {
      rows = (await sql`
        SELECT
          o.id,
          o.label_or_hud,
          o.manufacturer,
          o.year_mfg,
          o.serial_number,
          l.total_amount as lien_amount,
          l.lien_holder
        FROM mh_ownership_records o
        LEFT JOIN mh_tax_liens l ON o.label_or_hud = l.label_or_hud
        WHERE o.street_number = ${streetNumber}
          AND o.street_name ILIKE ${'%' + streetName + '%'}
          AND o.zip_code = ${zipCode}
        LIMIT 1
      `) as Array<Record<string, unknown>>;
    } else {
      rows = (await sql`
        SELECT
          o.id,
          o.label_or_hud,
          o.manufacturer,
          o.year_mfg,
          o.serial_number,
          l.total_amount as lien_amount,
          l.lien_holder
        FROM mh_ownership_records o
        LEFT JOIN mh_tax_liens l ON o.label_or_hud = l.label_or_hud
        WHERE o.street_number = ${streetNumber}
          AND o.street_name ILIKE ${'%' + streetName + '%'}
        LIMIT 1
      `) as Array<Record<string, unknown>>;
    }

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      recordId: row.id as string,
      labelOrHud: row.label_or_hud as string,
      manufacturer: row.manufacturer as string | null,
      yearMfg: row.year_mfg ? Number(row.year_mfg) : null,
      serialNumber: row.serial_number as string | null,
      hasLien: row.lien_amount !== null,
      lienAmount: row.lien_amount ? Number(row.lien_amount) : null,
      lienHolder: row.lien_holder as string | null,
    };
  } catch (error) {
    console.warn('TDHCA lookup failed:', error);
    return null;
  }
}
