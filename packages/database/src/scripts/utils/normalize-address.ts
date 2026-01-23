/**
 * Address normalization utility for MH park clustering
 *
 * Normalizes street addresses to enable accurate grouping of ownership records
 * into parks. Strips lot/unit/space suffixes and normalizes common abbreviations.
 */

// Lot/unit/space suffix patterns to strip
const LOT_SUFFIX_PATTERN =
  /\s*(?:LOT|UNIT|TRLR|TRAILER|SPC|SPACE|APT|SUITE|STE|#)\s*#?\s*\w*$/i;

// Additional pattern for standalone # suffixes like "#210" or "# 210"
const HASH_SUFFIX_PATTERN = /\s+#\s*\w+$/;

// Street suffixes where a trailing number is likely a lot/unit, not a route
// Excludes HWY/LOOP/PKWY where trailing numbers are route designations
const NON_ROUTE_SUFFIXES = [
  'ST', 'RD', 'DR', 'AVE', 'BLVD', 'LN', 'CT', 'PL', 'CIR', 'TRL', 'WAY', 'TER',
];

// Pattern to strip bare trailing numbers after non-route street suffixes
// e.g., "5190 LIBERTY RD 3" → "5190 LIBERTY RD" but NOT "HWY 90" → "HWY"
const BARE_NUMBER_AFTER_SUFFIX = new RegExp(
  `(\\b(?:${NON_ROUTE_SUFFIXES.join('|')})\\b)\\s+\\d{1,4}$`
);

// Directional abbreviations (normalize to abbreviated form)
const DIRECTIONAL_MAP: Record<string, string> = {
  NORTH: 'N',
  SOUTH: 'S',
  EAST: 'E',
  WEST: 'W',
  NORTHEAST: 'NE',
  NORTHWEST: 'NW',
  SOUTHEAST: 'SE',
  SOUTHWEST: 'SW',
};

// Street type abbreviations (normalize to abbreviated form)
const STREET_TYPE_MAP: Record<string, string> = {
  STREET: 'ST',
  ROAD: 'RD',
  DRIVE: 'DR',
  AVENUE: 'AVE',
  BOULEVARD: 'BLVD',
  LANE: 'LN',
  COURT: 'CT',
  PLACE: 'PL',
  CIRCLE: 'CIR',
  PARKWAY: 'PKWY',
  HIGHWAY: 'HWY',
  TRAIL: 'TRL',
  WAY: 'WAY',
  TERRACE: 'TER',
  LOOP: 'LOOP',
};

/**
 * Normalize a street address for clustering purposes.
 *
 * Strips lot/unit identifiers, normalizes abbreviations, and collapses whitespace
 * so that addresses like "7151 WOODLAKE PARKWAY LOT 23" and "7151 WOODLAKE PKWY #45"
 * both normalize to "7151 WOODLAKE PKWY".
 */
export function normalizeStreetAddress(addr: string): string {
  if (!addr) return '';

  let normalized = addr.toUpperCase().trim();

  // Strip lot/unit/space/trailer suffixes (repeat to handle nested like "LOT #123")
  normalized = normalized.replace(LOT_SUFFIX_PATTERN, '');
  normalized = normalized.replace(HASH_SUFFIX_PATTERN, '');
  // Second pass for cases like "123 MAIN ST LOT"
  normalized = normalized.replace(LOT_SUFFIX_PATTERN, '');

  // Replace directional words with abbreviations
  for (const [full, abbr] of Object.entries(DIRECTIONAL_MAP)) {
    // Match as whole word only
    normalized = normalized.replace(new RegExp(`\\b${full}\\b`, 'g'), abbr);
  }

  // Replace street type words with abbreviations
  for (const [full, abbr] of Object.entries(STREET_TYPE_MAP)) {
    normalized = normalized.replace(new RegExp(`\\b${full}\\b`, 'g'), abbr);
  }

  // Strip bare trailing numbers after street suffixes (lot numbers without prefix)
  // e.g., "5190 LIBERTY RD 3" → "5190 LIBERTY RD"
  normalized = normalized.replace(BARE_NUMBER_AFTER_SUFFIX, '$1');

  // Collapse multiple spaces
  normalized = normalized.replace(/\s{2,}/g, ' ').trim();

  return normalized;
}
