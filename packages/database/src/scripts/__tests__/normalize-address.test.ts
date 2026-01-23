import { describe, it, expect } from 'vitest';
import { normalizeStreetAddress } from '../utils/normalize-address';

describe('normalizeStreetAddress', () => {
  it('returns empty string for empty input', () => {
    expect(normalizeStreetAddress('')).toBe('');
    expect(normalizeStreetAddress('  ')).toBe('');
  });

  it('uppercases and trims', () => {
    expect(normalizeStreetAddress('  123 main st  ')).toBe('123 MAIN ST');
  });

  it('strips LOT suffixes', () => {
    expect(normalizeStreetAddress('8622 S ZARZAMORA LOT #112')).toBe('8622 S ZARZAMORA');
    expect(normalizeStreetAddress('8622 S ZARZAMORA LOT 112')).toBe('8622 S ZARZAMORA');
    expect(normalizeStreetAddress('8622 S ZARZAMORA LOT')).toBe('8622 S ZARZAMORA');
  });

  it('strips UNIT suffixes', () => {
    expect(normalizeStreetAddress('5190 LIBERTY RD UNIT 3')).toBe('5190 LIBERTY RD');
    expect(normalizeStreetAddress('5190 LIBERTY RD UNIT #3')).toBe('5190 LIBERTY RD');
  });

  it('strips TRLR/TRAILER suffixes', () => {
    expect(normalizeStreetAddress('100 PARK AVE TRLR 106')).toBe('100 PARK AVE');
    expect(normalizeStreetAddress('100 PARK AVE TRAILER 5')).toBe('100 PARK AVE');
  });

  it('strips SPACE/SPC suffixes', () => {
    expect(normalizeStreetAddress('7151 WOODLAKE PKWY SPACE 7')).toBe('7151 WOODLAKE PKWY');
    expect(normalizeStreetAddress('7151 WOODLAKE PKWY SPC 12')).toBe('7151 WOODLAKE PKWY');
  });

  it('strips # suffixes', () => {
    expect(normalizeStreetAddress('9605 W US HWY 90 #119')).toBe('9605 W US HWY 90');
    expect(normalizeStreetAddress('9605 W US HWY 90 # 119')).toBe('9605 W US HWY 90');
  });

  it('normalizes STREET → ST', () => {
    expect(normalizeStreetAddress('100 MAIN STREET')).toBe('100 MAIN ST');
  });

  it('normalizes ROAD → RD', () => {
    expect(normalizeStreetAddress('5190 LIBERTY ROAD')).toBe('5190 LIBERTY RD');
  });

  it('normalizes DRIVE → DR', () => {
    expect(normalizeStreetAddress('200 SUNSET DRIVE')).toBe('200 SUNSET DR');
  });

  it('normalizes AVENUE → AVE', () => {
    expect(normalizeStreetAddress('500 PARK AVENUE')).toBe('500 PARK AVE');
  });

  it('normalizes BOULEVARD → BLVD', () => {
    expect(normalizeStreetAddress('100 BROADWAY BOULEVARD')).toBe('100 BROADWAY BLVD');
  });

  it('normalizes LANE → LN', () => {
    expect(normalizeStreetAddress('50 OAK LANE')).toBe('50 OAK LN');
  });

  it('normalizes PARKWAY → PKWY', () => {
    expect(normalizeStreetAddress('7151 WOODLAKE PARKWAY')).toBe('7151 WOODLAKE PKWY');
  });

  it('normalizes HIGHWAY → HWY', () => {
    expect(normalizeStreetAddress('9605 W US HIGHWAY 90')).toBe('9605 W US HWY 90');
  });

  it('normalizes directionals NORTH → N, SOUTH → S, etc.', () => {
    expect(normalizeStreetAddress('100 NORTH MAIN ST')).toBe('100 N MAIN ST');
    expect(normalizeStreetAddress('200 SOUTH ELM DR')).toBe('200 S ELM DR');
    expect(normalizeStreetAddress('300 EAST OAK AVE')).toBe('300 E OAK AVE');
    expect(normalizeStreetAddress('400 WEST PINE BLVD')).toBe('400 W PINE BLVD');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeStreetAddress('100  MAIN   ST')).toBe('100 MAIN ST');
  });

  it('merges variant addresses for known parks', () => {
    const a = normalizeStreetAddress('7151 WOODLAKE PKWY LOT 23');
    const b = normalizeStreetAddress('7151 WOODLAKE PARKWAY #45');
    const c = normalizeStreetAddress('7151 WOODLAKE PKWY SPACE 7');
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(a).toBe('7151 WOODLAKE PKWY');
  });

  it('handles real TDHCA addresses', () => {
    expect(normalizeStreetAddress('8622 S. ZARZAMORA LOT #112')).toBe('8622 S. ZARZAMORA');
    expect(normalizeStreetAddress('5190 LIBERTY RD 3')).toBe('5190 LIBERTY RD');
    expect(normalizeStreetAddress('9605 W US HWY 90 #119')).toBe('9605 W US HWY 90');
    expect(normalizeStreetAddress('8671 SW LOOP 410 #53')).toBe('8671 SW LOOP 410');
  });

  it('handles address with only numbers after street name', () => {
    // "5190 LIBERTY RD 3" — the trailing "3" could be a lot number
    const result = normalizeStreetAddress('5190 LIBERTY RD 3');
    expect(result).toBe('5190 LIBERTY RD');
  });
});
