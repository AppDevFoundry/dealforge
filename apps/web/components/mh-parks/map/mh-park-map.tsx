'use client';

import type { BBox, CcnArea, CcnFacility, FloodZone } from '@dealforge/types';
import type { MhCommunity } from '@dealforge/types';
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

import { useInfrastructure } from '@/lib/hooks/use-infrastructure';
import { InfrastructurePopup, type InfrastructurePopupData } from './infrastructure-popup';
import { LayerControls, type LayerVisibility } from './layer-controls';
import { MapLegend } from './map-legend';
import { ParkPopup } from './park-popup';

interface MhParkMapProps {
  parks: MhCommunity[];
  selectedPark?: MhCommunity | null;
  onParkSelect?: (park: MhCommunity | null) => void;
}

// Texas center coordinates
const DEFAULT_VIEW_STATE = {
  latitude: 29.5,
  longitude: -98.5,
  zoom: 6,
};

// Layer paint configurations
const CCN_WATER_FILL_PAINT = {
  'fill-color': '#3b82f6', // blue-500
  'fill-opacity': 0.3,
};

const CCN_WATER_LINE_PAINT = {
  'line-color': '#3b82f6',
  'line-width': 1,
};

const CCN_SEWER_FILL_PAINT = {
  'fill-color': '#a855f7', // purple-500
  'fill-opacity': 0.3,
};

const CCN_SEWER_LINE_PAINT = {
  'line-color': '#a855f7',
  'line-width': 1,
};

// Facility (infrastructure line) paint configurations
const FACILITY_WATER_LINE_PAINT = {
  'line-color': '#06b6d4', // cyan-500
  'line-width': 2,
};

const FACILITY_SEWER_LINE_PAINT = {
  'line-color': '#d946ef', // fuchsia-500
  'line-width': 2,
};

// Flood zone paint based on risk level
const FLOOD_ZONE_FILL_PAINT = {
  'fill-color': [
    'match',
    ['get', 'riskLevel'],
    'high',
    '#ef4444', // red-500
    'moderate',
    '#eab308', // yellow-500
    'low',
    '#22c55e', // green-500
    '#9ca3af', // gray-400 for undetermined
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

// Empty GeoJSON for fallback
const EMPTY_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

export function MhParkMap({ parks, selectedPark, onParkSelect }: MhParkMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState(DEFAULT_VIEW_STATE);
  const [popupPark, setPopupPark] = useState<MhCommunity | null>(null);
  const [infrastructurePopup, setInfrastructurePopup] = useState<{
    data: InfrastructurePopupData;
    lng: number;
    lat: number;
  } | null>(null);
  const [mapBbox, setMapBbox] = useState<BBox | null>(null);
  const [layers, setLayers] = useState<LayerVisibility>({
    communities: true,
    ccnWater: false,
    ccnSewer: false,
    facilityWater: false,
    facilitySewer: false,
    floodZones: false,
  });

  const { resolvedTheme } = useTheme();

  // Fetch infrastructure data based on current map bounds
  const {
    ccnWaterGeoJson,
    ccnSewerGeoJson,
    facilityWaterGeoJson,
    facilitySewerGeoJson,
    floodZonesGeoJson,
    isLoading: isInfrastructureLoading,
  } = useInfrastructure(mapBbox, { debounceMs: 500 });

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  // Use dark map style in dark mode
  const mapStyle =
    resolvedTheme === 'dark'
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11';

  // Filter parks with valid coordinates
  const parksWithCoords = useMemo(
    () => parks.filter((park) => park.latitude != null && park.longitude != null),
    [parks]
  );

  const handleMarkerClick = useCallback(
    (park: MhCommunity) => {
      setPopupPark(park);
      setInfrastructurePopup(null);
      onParkSelect?.(park);
    },
    [onParkSelect]
  );

  const handlePopupClose = useCallback(() => {
    setPopupPark(null);
  }, []);

  const handleInfrastructurePopupClose = useCallback(() => {
    setInfrastructurePopup(null);
  }, []);

  // Update bbox when map moves
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

  // Handle clicks on infrastructure layers
  const handleMapClick = useCallback((event: mapboxgl.MapMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Close existing popups
    setPopupPark(null);
    setInfrastructurePopup(null);

    // Query rendered features at click point
    const features = map.queryRenderedFeatures(event.point, {
      layers: [
        'ccn-water-fill',
        'ccn-sewer-fill',
        'facility-water-line',
        'facility-sewer-line',
        'flood-zones-fill',
      ].filter((layerId) => {
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

    // Determine the type of feature clicked
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
    } else if (feature.layer?.id?.startsWith('facility-')) {
      const facility: CcnFacility = {
        id: properties.id,
        ccnNumber: properties.ccnNumber,
        utilityName: properties.utilityName,
        serviceType: properties.serviceType,
        county: properties.county,
      };
      setInfrastructurePopup({
        data: { type: 'facility', data: facility },
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

  // Set cursor on hover over infrastructure layers
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
      <div className="flex h-[500px] items-center justify-center rounded-lg border border-dashed bg-muted/20">
        <div className="text-center">
          <p className="text-muted-foreground">Mapbox token not configured</p>
          <p className="text-xs text-muted-foreground mt-1">
            Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment
          </p>
        </div>
      </div>
    );
  }

  // Check if any infrastructure layers are active
  const hasActiveInfrastructureLayers =
    layers.ccnWater ||
    layers.ccnSewer ||
    layers.facilityWater ||
    layers.facilitySewer ||
    layers.floodZones;

  return (
    <div className="relative h-[500px] rounded-lg overflow-hidden border">
      {/* Layer Controls */}
      <LayerControls
        layers={layers}
        onLayersChange={setLayers}
        isLoading={isInfrastructureLoading && hasActiveInfrastructureLayers}
      />

      {/* Map Legend */}
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
            ? [
                'ccn-water-fill',
                'ccn-sewer-fill',
                'facility-water-line',
                'facility-sewer-line',
                'flood-zones-fill',
              ]
            : undefined
        }
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <NavigationControl position="top-right" />

        {/* Infrastructure layers (rendered below markers) */}

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

        {/* Water Facility Lines */}
        {layers.facilityWater && (
          <Source id="facility-water" type="geojson" data={facilityWaterGeoJson ?? EMPTY_GEOJSON}>
            <Layer id="facility-water-line" type="line" paint={FACILITY_WATER_LINE_PAINT} />
          </Source>
        )}

        {/* Sewer Facility Lines */}
        {layers.facilitySewer && (
          <Source id="facility-sewer" type="geojson" data={facilitySewerGeoJson ?? EMPTY_GEOJSON}>
            <Layer id="facility-sewer-line" type="line" paint={FACILITY_SEWER_LINE_PAINT} />
          </Source>
        )}

        {/* Park Markers (rendered above infrastructure layers) */}
        {layers.communities &&
          parksWithCoords.map((park) => (
            <Marker
              key={park.id}
              latitude={park.latitude!}
              longitude={park.longitude!}
              anchor="bottom"
              onClick={(e: MarkerEvent<MouseEvent>) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(park);
              }}
            >
              <div
                className={`cursor-pointer transition-transform hover:scale-110 ${
                  selectedPark?.id === park.id ? 'scale-125' : ''
                }`}
              >
                <svg
                  width="24"
                  height="32"
                  viewBox="0 0 24 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={selectedPark?.id === park.id ? 'text-primary' : 'text-blue-600'}
                  role="img"
                  aria-label={`Map marker for ${park.name}`}
                >
                  <path
                    d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20c0-6.627-5.373-12-12-12z"
                    fill="currentColor"
                  />
                  <circle cx="12" cy="12" r="5" fill="white" />
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
            offset={[0, -32]}
            onClose={handlePopupClose}
            closeOnClick={false}
          >
            <ParkPopup park={popupPark} />
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
