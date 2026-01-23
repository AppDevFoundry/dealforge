'use client';

import type { MhCommunity } from '@dealforge/types';
import type { GeoJSONFeatureCollection, InfrastructureLayerVisibility } from '@dealforge/types';
import type { MapMouseEvent, ViewStateChangeEvent } from '@vis.gl/react-mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Map as MapboxMap, Marker, NavigationControl, Popup } from '@vis.gl/react-mapbox';
import { useTheme } from 'next-themes';
import { useCallback, useMemo, useRef, useState } from 'react';

import { InfrastructureLayers } from './infrastructure-layers';
import { InfrastructurePopup, type InfrastructurePopupData } from './infrastructure-popup';
import { ParkPopup } from './park-popup';

interface MhParkMapProps {
  parks: MhCommunity[];
  selectedPark?: MhCommunity | null;
  onParkSelect?: (park: MhCommunity | null) => void;
  infraVisibility?: InfrastructureLayerVisibility;
  ccnData?: GeoJSONFeatureCollection;
  floodData?: GeoJSONFeatureCollection;
  onBboxChange?: (bbox: string) => void;
}

// Texas center coordinates
const DEFAULT_VIEW_STATE = {
  latitude: 29.5,
  longitude: -98.5,
  zoom: 6,
};

const INTERACTIVE_LAYER_IDS = [
  'ccn-water-fill',
  'ccn-sewer-fill',
  'flood-high-fill',
  'flood-moderate-fill',
];

const DEFAULT_VISIBILITY: InfrastructureLayerVisibility = {
  communities: true,
  waterCcn: false,
  sewerCcn: false,
  floodZonesHigh: false,
  floodZonesModerate: false,
};

export function MhParkMap({
  parks,
  selectedPark,
  onParkSelect,
  infraVisibility = DEFAULT_VISIBILITY,
  ccnData,
  floodData,
  onBboxChange,
}: MhParkMapProps) {
  const [viewState, setViewState] = useState(DEFAULT_VIEW_STATE);
  const [popupPark, setPopupPark] = useState<MhCommunity | null>(null);
  const [infraPopup, setInfraPopup] = useState<{
    data: InfrastructurePopupData;
    lng: number;
    lat: number;
  } | null>(null);
  const { resolvedTheme } = useTheme();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const mapStyle =
    resolvedTheme === 'dark'
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11';

  const parksWithCoords = useMemo(
    () => parks.filter((park) => park.latitude != null && park.longitude != null),
    [parks]
  );

  const handleMarkerClick = useCallback(
    (park: MhCommunity) => {
      setPopupPark(park);
      setInfraPopup(null);
      onParkSelect?.(park);
    },
    [onParkSelect]
  );

  const handlePopupClose = useCallback(() => {
    setPopupPark(null);
  }, []);

  const handleInfraPopupClose = useCallback(() => {
    setInfraPopup(null);
  }, []);

  const handleMoveEnd = useCallback(
    (evt: ViewStateChangeEvent) => {
      if (!onBboxChange) return;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        const map = evt.target;
        const bounds = map.getBounds();
        if (bounds) {
          const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
          onBboxChange(bbox);
        }
      }, 300);
    },
    [onBboxChange]
  );

  const handleMapClick = useCallback((evt: MapMouseEvent) => {
    const features = evt.features;
    if (!features || features.length === 0) return;

    const feature = features[0];
    if (!feature) return;

    const layerId = feature.layer?.id;
    const props = feature.properties;
    if (!props) return;

    if (layerId === 'ccn-water-fill' || layerId === 'ccn-sewer-fill') {
      setInfraPopup({
        data: {
          type: 'ccn',
          properties: {
            id: props.id as string,
            ccnNumber: props.ccnNumber as string,
            utilityName: props.utilityName as string,
            serviceType: props.serviceType as 'water' | 'sewer' | 'both',
            county: props.county as string,
          },
        },
        lng: evt.lngLat.lng,
        lat: evt.lngLat.lat,
      });
      setPopupPark(null);
    } else if (layerId === 'flood-high-fill' || layerId === 'flood-moderate-fill') {
      setInfraPopup({
        data: {
          type: 'flood',
          properties: {
            id: props.id as string,
            zoneCode: props.zoneCode as 'A' | 'AE' | 'X',
            zoneDescription: (props.zoneDescription as string) ?? null,
            county: props.county as string,
            riskLevel: props.riskLevel as 'high' | 'moderate' | 'low' | 'undetermined',
          },
        },
        lng: evt.lngLat.lng,
        lat: evt.lngLat.lat,
      });
      setPopupPark(null);
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

  return (
    <div className="h-[500px] rounded-lg overflow-hidden border">
      <MapboxMap
        {...viewState}
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
        onMoveEnd={handleMoveEnd}
        onClick={handleMapClick}
        interactiveLayerIds={INTERACTIVE_LAYER_IDS}
        mapStyle={mapStyle}
        mapboxAccessToken={mapboxToken}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />

        {/* Infrastructure polygon layers */}
        <InfrastructureLayers
          ccnData={ccnData}
          floodData={floodData}
          visibility={infraVisibility}
        />

        {/* Park markers (rendered on top of polygons) */}
        {infraVisibility.communities &&
          parksWithCoords.map((park) => (
            <Marker
              key={park.id}
              latitude={park.latitude!}
              longitude={park.longitude!}
              anchor="bottom"
              onClick={(e) => {
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

        {/* Park popup */}
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

        {/* Infrastructure popup */}
        {infraPopup && (
          <Popup
            latitude={infraPopup.lat}
            longitude={infraPopup.lng}
            anchor="bottom"
            onClose={handleInfraPopupClose}
            closeOnClick={false}
          >
            <InfrastructurePopup data={infraPopup.data} />
          </Popup>
        )}
      </MapboxMap>
    </div>
  );
}
