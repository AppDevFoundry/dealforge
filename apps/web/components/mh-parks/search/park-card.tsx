'use client';

import type { MhCommunity } from '@dealforge/types';
import { Building2, ExternalLink, MapPin, User, Users } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ParkCardProps {
  park: MhCommunity;
  onClick?: (park: MhCommunity) => void;
  isSelected?: boolean;
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

export function ParkCard({ park, onClick, isSelected }: ParkCardProps) {
  const occupancyPercent = park.estimatedOccupancy
    ? Math.round(park.estimatedOccupancy * 100)
    : null;

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
      }`}
      onClick={() => onClick?.(park)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-tight">{park.name}</CardTitle>
          <Badge className={`shrink-0 text-xs ${getPropertyTypeColor(park.propertyType)}`}>
            {getPropertyTypeLabel(park.propertyType)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {park.city}, {park.county} County
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {park.lotCount && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{park.lotCount}</span>
              <span className="text-muted-foreground">lots</span>
            </div>
          )}

          {occupancyPercent !== null && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span
                className={`font-medium ${
                  occupancyPercent >= 90
                    ? 'text-success'
                    : occupancyPercent >= 80
                      ? 'text-warning'
                      : 'text-destructive'
                }`}
              >
                {occupancyPercent}%
              </span>
              <span className="text-muted-foreground">occupied</span>
            </div>
          )}
        </div>

        {park.ownerName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1 border-t">
            <User className="h-4 w-4 shrink-0" />
            <span className="truncate">{park.ownerName}</span>
          </div>
        )}

        <Link
          href={`/mh-parks/${park.id}`}
          className="flex items-center gap-1 text-xs text-primary hover:underline pt-2"
          onClick={(e) => e.stopPropagation()}
        >
          View Details
          <ExternalLink className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
