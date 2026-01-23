'use client';

import type { MhCommunity } from '@dealforge/types';
import { ArrowLeft, MapPin } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ParkDetailHeaderProps {
  park: MhCommunity;
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

function getPropertyTypeColor(type: string | null): string {
  switch (type) {
    case 'all_ages':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'senior_55+':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'family':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

function getSourceLabel(source: string): string {
  switch (source) {
    case 'tdhca':
      return 'TDHCA Discovered';
    case 'hud':
      return 'HUD';
    case 'mhvillage':
      return 'MHVillage';
    default:
      return source;
  }
}

export function ParkDetailHeader({ park }: ParkDetailHeaderProps) {
  return (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/mh-parks/search">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Search
        </Link>
      </Button>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{park.name}</h1>
        <div className="flex items-center gap-2">
          <Badge className={getPropertyTypeColor(park.propertyType)}>
            {getPropertyTypeLabel(park.propertyType)}
          </Badge>
          <Badge variant="outline">{getSourceLabel(park.source)}</Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>
          {park.address && `${park.address}, `}
          {park.city}, {park.county} County, {park.state} {park.zipCode || ''}
        </span>
      </div>
    </div>
  );
}
