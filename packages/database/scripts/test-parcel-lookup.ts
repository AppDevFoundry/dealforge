/**
 * Test script for parcel lookup
 *
 * Run with: npx tsx scripts/test-parcel-lookup.ts
 */

// Test coordinates (known parcel locations in Texas)
const TEST_COORDS = {
  // The Alamo - Bexar County
  sanAntonio: { lat: 29.426, lng: -98.486 },
  // Texas State Capitol - Travis County
  austin: { lat: 30.2747, lng: -97.7404 },
  // Minute Maid Park - Harris County
  houston: { lat: 29.757, lng: -95.355 },
};

const TXGIO_PARCELS_URL =
  'https://feature.geographic.texas.gov/arcgis/rest/services/Parcels/stratmap_land_parcels_48_most_recent/MapServer/0';

async function testTxGIOApi(lat: number, lng: number, label: string) {
  console.log(`\n=== Testing ${label} (${lat}, ${lng}) ===`);

  const url = new URL(`${TXGIO_PARCELS_URL}/query`);
  url.searchParams.set('geometry', `${lng},${lat}`);
  url.searchParams.set('geometryType', 'esriGeometryPoint');
  url.searchParams.set('inSR', '4326'); // Input coordinates are WGS84
  url.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
  url.searchParams.set('outFields', 'prop_id,county,owner_name,situs_addr,mkt_value,legal_area');
  url.searchParams.set('returnGeometry', 'false'); // Skip geometry for quick test
  url.searchParams.set('f', 'json');

  try {
    const start = Date.now();
    const response = await fetch(url.toString());
    const elapsed = Date.now() - start;

    if (!response.ok) {
      console.log(`  ✗ HTTP Error: ${response.status}`);
      return;
    }

    const data = await response.json();

    if (data.error) {
      console.log(`  ✗ API Error: ${data.error.message}`);
      return;
    }

    if (!data.features || data.features.length === 0) {
      console.log(`  ✗ No parcel found at this location`);
      return;
    }

    const parcel = data.features[0].attributes;
    console.log(`  ✓ Found parcel in ${elapsed}ms`);
    console.log(`    Property ID: ${parcel.prop_id}`);
    console.log(`    County: ${parcel.county}`);
    console.log(`    Owner: ${parcel.owner_name || 'N/A'}`);
    console.log(`    Address: ${parcel.situs_addr || 'N/A'}`);
    console.log(`    Market Value: ${parcel.mkt_value ? `$${parcel.mkt_value.toLocaleString()}` : 'N/A'}`);
    console.log(`    Legal Area: ${parcel.legal_area || 'N/A'}`);

  } catch (error) {
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

async function main() {
  console.log('TxGIO Parcel Lookup Test');
  console.log('========================');
  console.log(`API: ${TXGIO_PARCELS_URL}`);

  await testTxGIOApi(TEST_COORDS.sanAntonio.lat, TEST_COORDS.sanAntonio.lng, 'San Antonio');
  await testTxGIOApi(TEST_COORDS.austin.lat, TEST_COORDS.austin.lng, 'Austin');
  await testTxGIOApi(TEST_COORDS.houston.lat, TEST_COORDS.houston.lng, 'Houston');

  console.log('\n✓ Test complete');
}

main();
