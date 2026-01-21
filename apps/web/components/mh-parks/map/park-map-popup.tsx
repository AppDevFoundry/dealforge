'use client';

import type { MhCommunity } from '@dealforge/types';
import { X } from 'lucide-react';
import { Popup } from 'react-map-gl/mapbox';

interface ParkMapPopupProps {
  community: MhCommunity;
  onClose: () => void;
}

export function ParkMapPopup({ community, onClose }: ParkMapPopupProps) {
  if (!community.latitude || !community.longitude) return null;

  return (
    <Popup
      latitude={community.latitude}
      longitude={community.longitude}
      closeOnClick={false}
      onClose={onClose}
      anchor="bottom"
      offset={15}
    >
      <div className="min-w-[200px] p-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm">{community.name}</h3>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
        {community.address && (
          <p className="text-xs text-muted-foreground mt-1">{community.address}</p>
        )}
        <div className="mt-2 space-y-0.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">County</span>
            <span className="font-medium">{community.county}</span>
          </div>
          {community.lotCount && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lots</span>
              <span className="font-medium">{community.lotCount}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium capitalize">{community.propertyType}</span>
          </div>
        </div>
      </div>
    </Popup>
  );
}
