/**
 * Geocoding utilities using Mapbox
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  zipCode: string;
  county?: string;
  city?: string;
  state?: string;
}

/**
 * Geocode an address using Mapbox Geocoding API
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  // Support both server-side and client-side env var names
  const mapboxToken =
    process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!mapboxToken) {
    console.warn('MAPBOX_ACCESS_TOKEN not set, skipping geocoding');
    return null;
  }

  const encodedAddress = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&country=US&types=address&limit=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Geocoding failed:', response.status);
      return null;
    }

    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      return null;
    }

    const feature = data.features[0];
    const [longitude, latitude] = feature.center;

    // Extract context components
    let zipCode = '';
    let county = '';
    let city = '';
    let state = '';

    for (const ctx of feature.context || []) {
      if (ctx.id.startsWith('postcode')) {
        zipCode = ctx.text;
      } else if (ctx.id.startsWith('district')) {
        county = ctx.text.replace(' County', '');
      } else if (ctx.id.startsWith('place')) {
        city = ctx.text;
      } else if (ctx.id.startsWith('region')) {
        // State is usually in short_code like "US-TX"
        state = ctx.short_code?.split('-')[1] || ctx.text;
      }
    }

    return {
      latitude,
      longitude,
      formattedAddress: feature.place_name,
      zipCode,
      county,
      city,
      state,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
