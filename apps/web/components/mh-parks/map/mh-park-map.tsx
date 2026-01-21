'use client';

import type { MhCommunity } from '@dealforge/types';
import type { MarkerEvent, ViewStateChangeEvent } from '@vis.gl/react-mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTheme } from 'next-themes';
import { useCallback, useMemo, useState } from 'react';
import Map, { Marker, NavigationControl, Popup } from '@vis.gl/react-mapbox';

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

export function MhParkMap({ parks, selectedPark, onParkSelect }: MhParkMapProps) {
  const [viewState, setViewState] = useState(DEFAULT_VIEW_STATE);
  const [popupPark, setPopupPark] = useState<MhCommunity | null>(null);
  const { resolvedTheme } = useTheme();

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  // Use dark map style in dark mode
  const mapStyle = resolvedTheme === 'dark'
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
      onParkSelect?.(park);
    },
    [onParkSelect]
  );

  const handlePopupClose = useCallback(() => {
    setPopupPark(null);
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
      <Map
        {...viewState}
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
        mapStyle={mapStyle}
        mapboxAccessToken={mapboxToken}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="top-right" />

        {parksWithCoords.map((park) => (
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

        {popupPark && popupPark.latitude && popupPark.longitude && (
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
      </Map>
    </div>
  );
}
