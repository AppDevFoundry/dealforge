'use client';

import type { MhCommunity, MhPropertyType } from '@dealforge/types';
import { useTheme } from 'next-themes';
import { useCallback, useRef, useState } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';
import MapGL, { type MapEvent, type ViewStateChangeEvent } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

import { ParkMapControls } from './park-map-controls';
import { ParkMapMarkers } from './park-map-markers';
import { ParkMapPopup } from './park-map-popup';
import { ParkMapSearch } from './park-map-search';
import { useParkMapData } from './use-park-map-data';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const INITIAL_VIEW = {
  latitude: 29.5,
  longitude: -98.5,
  zoom: 6,
};

const ALL_TYPES: MhPropertyType[] = ['family', 'senior', 'mixed', 'unknown'];

export function ParkMap() {
  const { resolvedTheme } = useTheme();
  const { communities, isLoading, updateBounds } = useParkMapData();
  const mapRef = useRef<MapRef | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<MhCommunity | null>(null);
  const [visibleTypes, setVisibleTypes] = useState<Set<MhPropertyType>>(new Set(ALL_TYPES));

  const mapStyle =
    resolvedTheme === 'dark'
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11';

  const handleMoveEnd = useCallback(
    (e: ViewStateChangeEvent) => {
      const map = e.target;
      const mapBounds = map.getBounds();
      if (mapBounds) {
        updateBounds({
          sw: { lat: mapBounds.getSouthWest().lat, lng: mapBounds.getSouthWest().lng },
          ne: { lat: mapBounds.getNorthEast().lat, lng: mapBounds.getNorthEast().lng },
        });
      }
    },
    [updateBounds]
  );

  const handleSearchSelect = useCallback((lng: number, lat: number, zoom: number) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1500 });
  }, []);

  const handleToggleType = (type: MhPropertyType) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <p className="text-muted-foreground">Mapbox token not configured</p>
          <p className="text-xs text-muted-foreground mt-1">
            Set NEXT_PUBLIC_MAPBOX_TOKEN in your environment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[600px] rounded-lg overflow-hidden border">
      <MapGL
        ref={mapRef}
        initialViewState={INITIAL_VIEW}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        onMoveEnd={handleMoveEnd}
        onLoad={(e: MapEvent) => {
          const map = e.target;
          const mapBounds = map.getBounds();
          if (mapBounds) {
            updateBounds({
              sw: { lat: mapBounds.getSouthWest().lat, lng: mapBounds.getSouthWest().lng },
              ne: { lat: mapBounds.getNorthEast().lat, lng: mapBounds.getNorthEast().lng },
            });
          }
        }}
      >
        <ParkMapMarkers
          communities={communities}
          visibleTypes={visibleTypes}
          onMarkerClick={setSelectedCommunity}
        />

        {selectedCommunity && (
          <ParkMapPopup community={selectedCommunity} onClose={() => setSelectedCommunity(null)} />
        )}
      </MapGL>

      <ParkMapControls visibleTypes={visibleTypes} onToggleType={handleToggleType} />
      <ParkMapSearch onSelect={handleSearchSelect} />

      {isLoading && (
        <div className="absolute top-16 right-4 z-10 bg-background/80 px-3 py-1.5 rounded-md text-xs text-muted-foreground">
          Loading...
        </div>
      )}
    </div>
  );
}
