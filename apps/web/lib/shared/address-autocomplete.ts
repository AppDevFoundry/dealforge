/**
 * Address autocomplete utilities using Mapbox Geocoding API
 */

export interface AddressSuggestion {
  id: string;
  placeName: string; // Full address: "123 Main St, San Antonio, TX 78201"
  addressText: string; // Street address: "123 Main St"
  placeText: string; // Context: "San Antonio, TX 78201"
}

/**
 * Fetch address suggestions from Mapbox Geocoding API
 * @param query - The address search query
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Array of address suggestions
 */
export async function fetchAddressSuggestions(
  query: string,
  signal?: AbortSignal
): Promise<AddressSuggestion[]> {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!mapboxToken) {
    console.warn('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN not set, skipping address autocomplete');
    return [];
  }

  const encodedQuery = encodeURIComponent(query);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&country=US&types=address&autocomplete=true&limit=5`;

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      console.error('Address autocomplete failed:', response.status);
      return [];
    }

    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      return [];
    }

    // Parse features into simplified suggestion format
    return data.features.map((feature: any) => {
      // Extract address components
      const placeName = feature.place_name || '';
      const addressText = feature.text || '';

      // Extract context (city, state, zip)
      const contextParts: string[] = [];
      for (const ctx of feature.context || []) {
        if (ctx.id.startsWith('place')) {
          contextParts.push(ctx.text);
        } else if (ctx.id.startsWith('region')) {
          const state = ctx.short_code?.split('-')[1] || ctx.text;
          contextParts.push(state);
        } else if (ctx.id.startsWith('postcode')) {
          contextParts.push(ctx.text);
        }
      }
      const placeText = contextParts.join(', ');

      return {
        id: feature.id,
        placeName,
        addressText,
        placeText,
      };
    });
  } catch (error) {
    // Don't log AbortError as it's expected when requests are cancelled
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('Address autocomplete error:', error);
    }
    return [];
  }
}
