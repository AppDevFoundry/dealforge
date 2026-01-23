import { index, integer, pgTable, real, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

/**
 * MH Ownership Records table
 *
 * Raw TDHCA title/ownership CSV data from MHWeb downloads.
 * Each record represents a manufactured home title certificate.
 */
export const mhOwnershipRecords = pgTable(
  'mh_ownership_records',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `mho_${createId()}`),
    certificateNumber: text('certificate_number').notNull().unique(),
    label: text('label'),
    serialNumber: text('serial_number'),
    manufacturerName: text('manufacturer_name'),
    model: text('model'),
    manufactureDate: text('manufacture_date'),
    sections: integer('sections'),
    squareFeet: integer('square_feet'),
    saleDate: text('sale_date'),
    sellerName: text('seller_name'),
    ownerName: text('owner_name'),
    ownerAddress: text('owner_address'),
    ownerCity: text('owner_city'),
    ownerState: text('owner_state'),
    ownerZip: text('owner_zip'),
    installCounty: text('install_county'),
    installAddress: text('install_address'),
    installCity: text('install_city'),
    installState: text('install_state'),
    installZip: text('install_zip'),
    windZone: text('wind_zone'),
    issueDate: text('issue_date'),
    electionType: text('election_type'), // PPNW, PPUD, RPNW, RPUD
    lienHolder1: text('lien_holder_1'),
    lienDate1: text('lien_date_1'),
    sourceFile: text('source_file'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_ownership_install_county').on(table.installCounty),
    index('idx_ownership_install_address').on(table.installAddress),
    index('idx_ownership_cert_num').on(table.certificateNumber),
  ]
);

/**
 * MH Tax Liens table
 *
 * TDHCA tax lien records from MHWeb downloads.
 */
export const mhTaxLiens = pgTable(
  'mh_tax_liens',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `mhl_${createId()}`),
    taxRollNumber: text('tax_roll_number'),
    payerName: text('payer_name'),
    payerAddress: text('payer_address'),
    payerCity: text('payer_city'),
    label: text('label'),
    serialNumber: text('serial_number'),
    county: text('county'),
    taxUnitId: text('tax_unit_id'),
    taxUnitName: text('tax_unit_name'),
    taxYear: integer('tax_year'),
    lienDate: text('lien_date'),
    releaseDate: text('release_date'),
    taxAmount: real('tax_amount'),
    status: text('status'), // 'active', 'released'
    sourceFile: text('source_file'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_taxliens_county').on(table.county),
    index('idx_taxliens_serial').on(table.serialNumber),
    index('idx_taxliens_label').on(table.label),
    index('idx_taxliens_tax_year').on(table.taxYear),
  ]
);

// Type exports
export type MhOwnershipRecord = typeof mhOwnershipRecords.$inferSelect;
export type NewMhOwnershipRecord = typeof mhOwnershipRecords.$inferInsert;
export type MhTaxLien = typeof mhTaxLiens.$inferSelect;
export type NewMhTaxLien = typeof mhTaxLiens.$inferInsert;
