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
    // Build query conditions based on available location data
    let rows: Array<Record<string, unknown>>;

    if (city && zipCode) {
      rows = (await sql`
        SELECT
          o.id,
          o.label,
          o.manufacturer_name,
          o.manufacture_date,
          o.serial_number,
          o.lien_holder_1,
          l.tax_amount as lien_amount
        FROM mh_ownership_records o
        LEFT JOIN mh_tax_liens l ON o.label = l.label AND l.status = 'active'
        WHERE o.install_address ILIKE ${`%${address.split(',')[0]}%`}
          AND (o.install_city ILIKE ${city + '%'} OR o.install_zip = ${zipCode})
        LIMIT 1
      `) as Array<Record<string, unknown>>;
    } else if (city) {
      rows = (await sql`
        SELECT
          o.id,
          o.label,
          o.manufacturer_name,
          o.manufacture_date,
          o.serial_number,
          o.lien_holder_1,
          l.tax_amount as lien_amount
        FROM mh_ownership_records o
        LEFT JOIN mh_tax_liens l ON o.label = l.label AND l.status = 'active'
        WHERE o.install_address ILIKE ${`%${address.split(',')[0]}%`}
          AND o.install_city ILIKE ${city + '%'}
        LIMIT 1
      `) as Array<Record<string, unknown>>;
    } else if (zipCode) {
      rows = (await sql`
        SELECT
          o.id,
          o.label,
          o.manufacturer_name,
          o.manufacture_date,
          o.serial_number,
          o.lien_holder_1,
          l.tax_amount as lien_amount
        FROM mh_ownership_records o
        LEFT JOIN mh_tax_liens l ON o.label = l.label AND l.status = 'active'
        WHERE o.install_address ILIKE ${`%${address.split(',')[0]}%`}
          AND o.install_zip = ${zipCode}
        LIMIT 1
      `) as Array<Record<string, unknown>>;
    } else {
      rows = (await sql`
        SELECT
          o.id,
          o.label,
          o.manufacturer_name,
          o.manufacture_date,
          o.serial_number,
          o.lien_holder_1,
          l.tax_amount as lien_amount
        FROM mh_ownership_records o
        LEFT JOIN mh_tax_liens l ON o.label = l.label AND l.status = 'active'
        WHERE o.install_address ILIKE ${`%${address.split(',')[0]}%`}
        LIMIT 1
      `) as Array<Record<string, unknown>>;
    }

    const row = rows[0];
    if (!row) {
      return null;
    }

    // Parse year from manufacture_date if available (format varies)
    let yearMfg: number | null = null;
    if (row.manufacture_date) {
      const dateStr = String(row.manufacture_date);
      const yearMatch = dateStr.match(/\d{4}/);
      if (yearMatch) {
        yearMfg = parseInt(yearMatch[0], 10);
      }
    }

    return {
      recordId: row.id as string,
      labelOrHud: row.label as string,
      manufacturer: row.manufacturer_name as string | null,
      yearMfg,
      serialNumber: row.serial_number as string | null,
      hasLien: row.lien_amount !== null,
      lienAmount: row.lien_amount ? Number(row.lien_amount) : null,
      lienHolder: row.lien_holder_1 as string | null,
    };
  } catch (error) {
    console.warn('TDHCA lookup failed:', error);
    return null;
  }
}
