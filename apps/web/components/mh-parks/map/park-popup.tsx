'use client';

import type { MhCommunity } from '@dealforge/types';
import { Building2, MapPin, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

interface ParkPopupProps {
  park: MhCommunity;
}

function formatOccupancy(occupancy: number | null): string {
  if (occupancy == null) return 'N/A';
  return `${Math.round(occupancy * 100)}%`;
}

function getPropertyTypeLabel(type: string | null): string {
  switch (type) {
    case 'all_ages':
      return 'All Ages';
    case 'senior_55+':
      return '55+';
    case 'family':
      return 'Family';
    default:
      return 'Unknown';
  }
}

export function ParkPopup({ park }: ParkPopupProps) {
  return (
    <div className="min-w-[200px] max-w-[280px] p-3 bg-card text-card-foreground">
      <h3 className="font-semibold text-sm mb-2">{park.name}</h3>

      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          <span>
            {park.city}, {park.county} County
          </span>
        </div>

        {park.lotCount && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="size-3 shrink-0" />
            <span>{park.lotCount} lots</span>
          </div>
        )}

        {park.estimatedOccupancy != null && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="size-3 shrink-0" />
            <span>{formatOccupancy(park.estimatedOccupancy)} occupancy</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Badge variant="secondary" className="text-xs">
            {getPropertyTypeLabel(park.propertyType)}
          </Badge>
          {park.ownerName && (
            <span className="text-muted-foreground truncate">{park.ownerName}</span>
          )}
        </div>
      </div>
    </div>
  );
}
