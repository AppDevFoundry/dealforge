'use client';

import type { MhCommunity, MhPropertyType } from '@dealforge/types';
import { Marker } from 'react-map-gl/mapbox';
import { TYPE_COLORS } from './park-map-controls';

interface ParkMapMarkersProps {
  communities: MhCommunity[];
  visibleTypes: Set<MhPropertyType>;
  onMarkerClick: (community: MhCommunity) => void;
}

export function ParkMapMarkers({ communities, visibleTypes, onMarkerClick }: ParkMapMarkersProps) {
  const filtered = communities.filter(
    (c) => c.latitude && c.longitude && visibleTypes.has(c.propertyType)
  );

  return (
    <>
      {filtered.map((community) => (
        <Marker
          key={community.id}
          latitude={community.latitude!}
          longitude={community.longitude!}
          anchor="center"
          onClick={(e: { originalEvent: MouseEvent }) => {
            e.originalEvent.stopPropagation();
            onMarkerClick(community);
          }}
        >
          <div
            className="w-3 h-3 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-150 transition-transform"
            style={{ backgroundColor: TYPE_COLORS[community.propertyType] || '#6b7280' }}
            title={community.name}
          />
        </Marker>
      ))}
    </>
  );
}
