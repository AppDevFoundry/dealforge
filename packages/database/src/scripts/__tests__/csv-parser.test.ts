import { describe, it, expect } from 'vitest';
import { parseCsvLine, mapTitleRow } from '../sync-tdhca-titles';
import { mapLienRow } from '../sync-tdhca-liens';

describe('parseCsvLine', () => {
  it('parses simple comma-separated values', () => {
    expect(parseCsvLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('parses quoted fields', () => {
    expect(parseCsvLine('"hello","world"')).toEqual(['hello', 'world']);
  });

  it('handles commas inside quotes', () => {
    expect(parseCsvLine('"SAN ANTONIO, TX","78223"')).toEqual(['SAN ANTONIO, TX', '78223']);
  });

  it('handles empty fields', () => {
    expect(parseCsvLine('"a","","c"')).toEqual(['a', '', 'c']);
  });

  it('handles escaped quotes (double-quote)', () => {
    expect(parseCsvLine('"say ""hello""","world"')).toEqual(['say "hello"', 'world']);
  });

  it('trims whitespace from fields', () => {
    expect(parseCsvLine('" hello "," world "')).toEqual(['hello', 'world']);
  });

  it('handles mixed quoted and unquoted fields', () => {
    expect(parseCsvLine('abc,"def",ghi')).toEqual(['abc', 'def', 'ghi']);
  });

  it('parses a real TDHCA title CSV header', () => {
    const header = '"CertNum","Label1","Serial1","ManufID","ManufName"';
    const fields = parseCsvLine(header);
    expect(fields).toEqual(['CertNum', 'Label1', 'Serial1', 'ManufID', 'ManufName']);
  });

  it('parses a real TDHCA title CSV data row', () => {
    const row = '"MH01122940","RAD1027260","TXFLV12A29837FD11","MHDMAN00000379","FLEETWOOD HOMES OF TX INC [#12-1]"';
    const fields = parseCsvLine(row);
    expect(fields[0]).toBe('MH01122940');
    expect(fields[1]).toBe('RAD1027260');
    expect(fields[4]).toBe('FLEETWOOD HOMES OF TX INC [#12-1]');
  });
});

describe('mapTitleRow', () => {
  const headers = [
    'CertNum', 'Label1', 'Serial1', 'ManufID', 'ManufName', 'ManufCity', 'ManufState',
    'ManufDate ', 'Model', 'Sections', 'SqrFeet', 'SaleDate  ', 'SellerID', 'SellerName',
    'SellerCity', 'SellerState', 'SellerCounty', 'BuyerID', 'OwnerName', 'OwnerAddr1',
    'OwnerAddr2', 'OwnerCity', 'OwnerState', 'OwnerZip', 'InstallCounty', 'LienDate1 ',
    'LienName1_1', 'LienDate2 ', 'LienName1_2', 'LienDate3 ', 'LienName1_3', 'LienDate4 ',
    'LienName1_4', 'WindZone', 'Issue_Date', 'Loc_Addr1', 'Loc_Addr2', 'Loc_City',
    'Loc_State', 'Loc_Zipcode', 'Election_Type', 'Deed_Status', 'CC_Iss_Dt',
    'Deed_Ltr_Dt', 'Deed_Resp_Dt',
  ].map((h) => h.trim());

  it('maps a valid row to TitleRecord', () => {
    const values = [
      'MH01122940', 'RAD1027260', 'TXFLV12A29837FD11', 'MHDMAN00000379',
      'FLEETWOOD HOMES OF TX INC [#12-1]', 'WACO', 'TX', '10/31/1997',
      'FESTIVAL LIMITED', '1', '1178', '11/01/2025', '', 'MARIA ELENA SANDOVAL',
      'PFLUGERVILLE', 'TX', 'TRAVIS', '', 'IRMA A QUINTERO SAUCEDO',
      '8622 S. ZARZAMORA LOT #112', '', 'SAN ANTONIO', 'TX', '78224', 'BEXAR',
      '', '', '', '', '', '', '', '', '1', '01/22/2026',
      '8622 S. ZARZAMORA LOT #112', '', 'SAN ANTONIO', 'TX', '78224',
      'PPUD', '', '01/22/2026', '', '',
    ];

    const record = mapTitleRow(headers, values);
    expect(record).not.toBeNull();
    expect(record!.certificateNumber).toBe('MH01122940');
    expect(record!.label).toBe('RAD1027260');
    expect(record!.serialNumber).toBe('TXFLV12A29837FD11');
    expect(record!.manufacturerName).toBe('FLEETWOOD HOMES OF TX INC [#12-1]');
    expect(record!.model).toBe('FESTIVAL LIMITED');
    expect(record!.sections).toBe(1);
    expect(record!.squareFeet).toBe(1178);
    expect(record!.ownerName).toBe('IRMA A QUINTERO SAUCEDO');
    expect(record!.installCounty).toBe('BEXAR');
    expect(record!.installAddress).toBe('8622 S. ZARZAMORA LOT #112');
    expect(record!.installCity).toBe('SAN ANTONIO');
    expect(record!.installZip).toBe('78224');
    expect(record!.electionType).toBe('PPUD');
  });

  it('returns null for empty cert number', () => {
    const values = ['', 'RAD1027260', 'SN123', ...Array(42).fill('')];
    const record = mapTitleRow(headers, values);
    expect(record).toBeNull();
  });

  it('handles non-numeric sections/sqft gracefully', () => {
    const values = ['MH001', '', '', '', '', '', '', '', '', 'abc', 'xyz', ...Array(34).fill('')];
    const record = mapTitleRow(headers, values);
    expect(record).not.toBeNull();
    expect(record!.sections).toBeNull();
    expect(record!.squareFeet).toBeNull();
  });
});

describe('mapLienRow', () => {
  const headers = [
    'TaxRollNum', 'PayerName', 'PayerAddr1', 'PayerAddr2', 'PayerAddr3',
    'Label1', 'Serial1', 'County', 'TaxUnitID', 'TaxUnitName',
    'TaxYear', 'LienDate', 'ReleaseDate', 'Tax Amount', 'DeleteExemptCode',
  ];

  it('maps a valid lien row', () => {
    const values = [
      '040070020843', 'SOLIS FRANCISCA C &', '10650 CASSIANO RD LOT 1', '',
      'SAN ANTONIO, TX 78223', 'TEX0556069', 'MP1250', 'BEXAR',
      'CTC-000-20', 'BEXAR COUNTY TAX OFFICE', '2024', '02/18/2025',
      '', '144.95', '',
    ];

    const record = mapLienRow(headers, values);
    expect(record).not.toBeNull();
    expect(record!.taxRollNumber).toBe('040070020843');
    expect(record!.payerName).toBe('SOLIS FRANCISCA C &');
    expect(record!.payerAddress).toBe('10650 CASSIANO RD LOT 1');
    expect(record!.payerCity).toBe('SAN ANTONIO');
    expect(record!.county).toBe('BEXAR');
    expect(record!.taxYear).toBe(2024);
    expect(record!.taxAmount).toBeCloseTo(144.95);
    expect(record!.status).toBe('active');
  });

  it('derives released status from release date', () => {
    const values = [
      '040070020843', 'SOLIS FRANCISCA', '10650 CASSIANO RD', '',
      'SAN ANTONIO, TX 78223', 'TEX0556069', 'MP1250', 'BEXAR',
      'CTC-000-20', 'BEXAR COUNTY TAX OFFICE', '2023', '02/18/2024',
      '06/15/2024', '200.00', '',
    ];

    const record = mapLienRow(headers, values);
    expect(record).not.toBeNull();
    expect(record!.status).toBe('released');
    expect(record!.releaseDate).toBe('06/15/2024');
  });

  it('returns null for empty tax roll number', () => {
    const values = ['', 'NAME', ...Array(13).fill('')];
    const record = mapLienRow(headers, values);
    expect(record).toBeNull();
  });

  it('handles non-numeric tax amount', () => {
    const values = [
      '12345', 'NAME', 'ADDR', '', 'CITY, TX 78000', '', '', 'BEXAR',
      '', '', '2024', '01/01/2025', '', 'N/A', '',
    ];

    const record = mapLienRow(headers, values);
    expect(record).not.toBeNull();
    expect(record!.taxAmount).toBeNull();
  });

  it('parses city from PayerAddr3 format', () => {
    const values = [
      '12345', 'NAME', 'ADDR', '', 'ELMENDORF, TX 78112', '', '', 'BEXAR',
      '', '', '2024', '01/01/2025', '', '100.00', '',
    ];

    const record = mapLienRow(headers, values);
    expect(record!.payerCity).toBe('ELMENDORF');
  });
});
