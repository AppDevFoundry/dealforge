'use client';

import type { BBox, CcnArea, FloodZone, LeadIntelligence, NearbyPark } from '@dealforge/types';
import type { MapRef, MarkerEvent, ViewStateChangeEvent } from '@vis.gl/react-mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Layer,
  Map as MapboxMap,
  Marker,
  NavigationControl,
  Popup,
  Source,
} from '@vis.gl/react-mapbox';
import { useTheme } from 'next-themes';
import { useCallback, useMemo, useRef, useState } from 'react';

import {
  InfrastructurePopup,
  type InfrastructurePopupData,
} from '@/components/mh-parks/map/infrastructure-popup';
import { LayerControls, type LayerVisibility } from '@/components/mh-parks/map/layer-controls';
import { MapLegend } from '@/components/mh-parks/map/map-legend';
import { useInfrastructure } from '@/lib/hooks/use-infrastructure';

interface LeadLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  address: string;
  intelligence?: LeadIntelligence | null;
}

// Layer paint configurations (same as mh-park-map)
const CCN_WATER_FILL_PAINT = {
  'fill-color': '#3b82f6',
  'fill-opacity': 0.3,
};

const CCN_WATER_LINE_PAINT = {
  'line-color': '#3b82f6',
  'line-width': 1,
};

const CCN_SEWER_FILL_PAINT = {
  'fill-color': '#a855f7',
  'fill-opacity': 0.3,
};

const CCN_SEWER_LINE_PAINT = {
  'line-color': '#a855f7',
  'line-width': 1,
};

const FLOOD_ZONE_FILL_PAINT = {
  'fill-color': [
    'match',
    ['get', 'riskLevel'],
    'high',
    '#ef4444',
    'moderate',
    '#eab308',
    'low',
    '#22c55e',
    '#9ca3af',
  ],
  'fill-opacity': ['match', ['get', 'riskLevel'], 'high', 0.4, 'moderate', 0.25, 'low', 0.2, 0.15],
};

const FLOOD_ZONE_LINE_PAINT = {
  'line-color': [
    'match',
    ['get', 'riskLevel'],
    'high',
    '#ef4444',
    'moderate',
    '#eab308',
    'low',
    '#22c55e',
    '#9ca3af',
  ],
  'line-width': 1,
};

const EMPTY_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

// Texas center as fallback
const TEXAS_CENTER = { latitude: 29.5, longitude: -98.5, zoom: 6 };

export function LeadLocationMap({
  latitude,
  longitude,
  address,
  intelligence,
}: LeadLocationMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [popupPark, setPopupPark] = useState<NearbyPark | null>(null);
  const [infrastructurePopup, setInfrastructurePopup] = useState<{
    data: InfrastructurePopupData;
    lng: number;
    lat: number;
  } | null>(null);
  const [mapBbox, setMapBbox] = useState<BBox | null>(null);
  const [layers, setLayers] = useState<LayerVisibility>({
    communities: true, // Nearby parks
    ccnWater: true,
    ccnSewer: true,
    facilityWater: false,
    facilitySewer: false,
    floodZones: true,
  });

  const { resolvedTheme } = useTheme();

  // Initial view state centered on property or Texas
  const initialViewState = useMemo(
    () => (latitude && longitude ? { latitude, longitude, zoom: 13 } : TEXAS_CENTER),
    [latitude, longitude]
  );

  const [viewState, setViewState] = useState(initialViewState);

  // Fetch infrastructure data
  const {
    ccnWaterGeoJson,
    ccnSewerGeoJson,
    floodZonesGeoJson,
    isLoading: isInfrastructureLoading,
  } = useInfrastructure(mapBbox, { debounceMs: 500 });

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const mapStyle =
    resolvedTheme === 'dark'
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11';

  // Get nearby parks with valid coordinates
  const nearbyParks = useMemo(
    () =>
      intelligence?.nearbyParks?.filter(
        (park) => park.latitude != null && park.longitude != null
      ) ?? [],
    [intelligence?.nearbyParks]
  );

  const handleParkMarkerClick = useCallback((park: NearbyPark) => {
    setPopupPark(park);
    setInfrastructurePopup(null);
  }, []);

  const handlePopupClose = useCallback(() => {
    setPopupPark(null);
  }, []);

  const handleInfrastructurePopupClose = useCallback(() => {
    setInfrastructurePopup(null);
  }, []);

  const handleMoveEnd = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const bounds = map.getBounds();
    if (bounds) {
      const newBbox: BBox = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];
      setMapBbox(newBbox);
    }
  }, []);

  const handleMapClick = useCallback((event: mapboxgl.MapMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    setPopupPark(null);
    setInfrastructurePopup(null);

    const features = map.queryRenderedFeatures(event.point, {
      layers: ['ccn-water-fill', 'ccn-sewer-fill', 'flood-zones-fill'].filter((layerId) => {
        try {
          return map.getLayer(layerId);
        } catch {
          return false;
        }
      }),
    });

    if (features.length === 0) return;

    const feature = features[0];
    if (!feature) return;

    const properties = feature.properties;
    if (!properties) return;

    const lngLat = event.lngLat;

    if (feature.layer?.id?.startsWith('ccn-')) {
      const ccnArea: CcnArea = {
        id: properties.id,
        ccnNumber: properties.ccnNumber,
        utilityName: properties.utilityName,
        serviceType: properties.serviceType,
        county: properties.county,
      };
      setInfrastructurePopup({
        data: { type: 'ccn', data: ccnArea },
        lng: lngLat.lng,
        lat: lngLat.lat,
      });
    } else if (feature.layer?.id?.startsWith('flood-')) {
      const floodZone: FloodZone = {
        id: properties.id,
        zoneCode: properties.zoneCode,
        zoneDescription: properties.zoneDescription,
        county: properties.county,
        riskLevel: properties.riskLevel,
      };
      setInfrastructurePopup({
        data: { type: 'flood', data: floodZone },
        lng: lngLat.lng,
        lat: lngLat.lat,
      });
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      map.getCanvas().style.cursor = 'pointer';
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      map.getCanvas().style.cursor = '';
    }
  }, []);

  if (!mapboxToken) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed bg-muted/20">
        <div className="text-center">
          <p className="text-muted-foreground">Mapbox token not configured</p>
          <p className="text-xs text-muted-foreground mt-1">
            Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment
          </p>
        </div>
      </div>
    );
  }

  if (!latitude || !longitude) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed bg-muted/20">
        <div className="text-center">
          <p className="text-muted-foreground">Location not available</p>
          <p className="text-xs text-muted-foreground mt-1">Waiting for geocoding to complete</p>
        </div>
      </div>
    );
  }

  const hasActiveInfrastructureLayers = layers.ccnWater || layers.ccnSewer || layers.floodZones;

  return (
    <div className="relative h-[400px] rounded-lg overflow-hidden border">
      <LayerControls
        layers={layers}
        onLayersChange={setLayers}
        isLoading={isInfrastructureLoading && hasActiveInfrastructureLayers}
      />

      <MapLegend layers={layers} />

      <MapboxMap
        ref={mapRef}
        {...viewState}
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
        onMoveEnd={handleMoveEnd}
        onClick={handleMapClick}
        onLoad={handleMoveEnd}
        mapStyle={mapStyle}
        mapboxAccessToken={mapboxToken}
        style={{ width: '100%', height: '100%' }}
        interactiveLayerIds={
          hasActiveInfrastructureLayers
            ? ['ccn-water-fill', 'ccn-sewer-fill', 'flood-zones-fill']
            : undefined
        }
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <NavigationControl position="top-right" />

        {/* Flood Zones Layer */}
        {layers.floodZones && (
          <Source id="flood-zones" type="geojson" data={floodZonesGeoJson ?? EMPTY_GEOJSON}>
            <Layer
              id="flood-zones-fill"
              type="fill"
              paint={FLOOD_ZONE_FILL_PAINT as unknown as mapboxgl.FillPaint}
            />
            <Layer
              id="flood-zones-line"
              type="line"
              paint={FLOOD_ZONE_LINE_PAINT as unknown as mapboxgl.LinePaint}
            />
          </Source>
        )}

        {/* CCN Water Layer */}
        {layers.ccnWater && (
          <Source id="ccn-water" type="geojson" data={ccnWaterGeoJson ?? EMPTY_GEOJSON}>
            <Layer id="ccn-water-fill" type="fill" paint={CCN_WATER_FILL_PAINT} />
            <Layer id="ccn-water-line" type="line" paint={CCN_WATER_LINE_PAINT} />
          </Source>
        )}

        {/* CCN Sewer Layer */}
        {layers.ccnSewer && (
          <Source id="ccn-sewer" type="geojson" data={ccnSewerGeoJson ?? EMPTY_GEOJSON}>
            <Layer id="ccn-sewer-fill" type="fill" paint={CCN_SEWER_FILL_PAINT} />
            <Layer id="ccn-sewer-line" type="line" paint={CCN_SEWER_LINE_PAINT} />
          </Source>
        )}

        {/* Property Marker (primary, red) */}
        <Marker latitude={latitude} longitude={longitude} anchor="bottom">
          <div className="cursor-pointer">
            <svg
              width="28"
              height="36"
              viewBox="0 0 24 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-red-600 drop-shadow-md"
              role="img"
              aria-label={`Property location: ${address}`}
            >
              <path
                d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z"
                fill="currentColor"
              />
              <circle cx="12" cy="12" r="5" fill="white" />
            </svg>
          </div>
        </Marker>

        {/* Nearby Park Markers (secondary, blue) */}
        {layers.communities &&
          nearbyParks.map((park) => (
            <Marker
              key={park.id}
              latitude={park.latitude!}
              longitude={park.longitude!}
              anchor="bottom"
              onClick={(e: MarkerEvent<MouseEvent>) => {
                e.originalEvent.stopPropagation();
                handleParkMarkerClick(park);
              }}
            >
              <div className="cursor-pointer transition-transform hover:scale-110">
                <svg
                  width="20"
                  height="26"
                  viewBox="0 0 24 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-blue-500"
                  role="img"
                  aria-label={`Nearby park: ${park.name}`}
                >
                  <path
                    d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z"
                    fill="currentColor"
                  />
                  <circle cx="12" cy="12" r="4" fill="white" />
                </svg>
              </div>
            </Marker>
          ))}

        {/* Park Popup */}
        {popupPark?.latitude && popupPark.longitude && (
          <Popup
            latitude={popupPark.latitude}
            longitude={popupPark.longitude}
            anchor="bottom"
            offset={[0, -26]}
            onClose={handlePopupClose}
            closeOnClick={false}
          >
            <div className="p-2 min-w-[150px]">
              <h3 className="font-semibold text-sm">{popupPark.name}</h3>
              <p className="text-xs text-muted-foreground">
                {popupPark.city}, {popupPark.county}
              </p>
              <p className="text-xs mt-1">
                {popupPark.distanceMiles} mi away
                {popupPark.lotCount && ` • ${popupPark.lotCount} lots`}
              </p>
            </div>
          </Popup>
        )}

        {/* Infrastructure Popup */}
        {infrastructurePopup && (
          <Popup
            latitude={infrastructurePopup.lat}
            longitude={infrastructurePopup.lng}
            anchor="bottom"
            offset={[0, -8]}
            onClose={handleInfrastructurePopupClose}
            closeOnClick={false}
          >
            <InfrastructurePopup popupData={infrastructurePopup.data} />
          </Popup>
        )}
      </MapboxMap>
    </div>
  );
}
