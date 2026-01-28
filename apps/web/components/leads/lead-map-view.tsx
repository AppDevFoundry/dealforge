'use client';

import type { LeadIntelligence } from '@dealforge/types';
import { useEffect, useRef } from 'react';

interface LeadMapViewProps {
  latitude: number;
  longitude: number;
  intelligence?: LeadIntelligence | null;
}

export function LeadMapView({ latitude, longitude, intelligence }: LeadMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token || !containerRef.current || mapRef.current) return;

    // Dynamically import mapbox to avoid SSR issues
    import('mapbox-gl').then((module) => {
      const mapboxgl = module.default;
      mapboxgl.accessToken = token;

      if (!containerRef.current) return;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/v1/mapbox/streets-v12',
        center: [longitude, latitude],
        zoom: 14,
        maxZoom: 18,
      });

      mapRef.current = map;

      map.on('load', () => {
        // Add property marker
        new mapboxgl.Marker({ color: '#3b82f6', scale: 1.2 })
          .setLngLat([longitude, latitude])
          .setPopup(new mapboxgl.Popup().setText('Property'))
          .addTo(map);

        // Add nearby parks markers
        if (intelligence?.nearbyParksData) {
          // Parks don't have coordinates stored in intelligence — show count badge instead
          // Future enhancement: store park coordinates in nearbyParksData
        }
      });

      return () => {
        map.remove();
        mapRef.current = null;
      };
    });
  }, [latitude, longitude, intelligence]);

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className="w-full rounded-lg overflow-hidden border"
        style={{ height: '300px' }}
      />
      {intelligence && (
        <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm border rounded-md px-2 py-1 text-xs">
          {intelligence.nearbyParksCount} nearby parks
        </div>
      )}
    </div>
  );
}
