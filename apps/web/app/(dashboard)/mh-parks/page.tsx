'use client';

import type { MhCommunity } from '@dealforge/types';
import { useMemo, useState } from 'react';

import { MhParkMap } from '@/components/mh-parks/map';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMhParks } from '@/lib/hooks/use-mh-parks';

type PropertyTypeFilter = 'all' | 'all_ages' | 'senior_55+' | 'family';

export default function MhParksPage() {
  const [selectedPark, setSelectedPark] = useState<MhCommunity | null>(null);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<PropertyTypeFilter>('all');

  // Fetch all parks with coordinates for the map
  const { data: parksResponse, isLoading } = useMhParks({
    perPage: 1000, // Get all parks for map
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const allParks = parksResponse?.data ?? [];

  // Filter parks by property type
  const parks = useMemo(() => {
    if (propertyTypeFilter === 'all') return allParks;
    return allParks.filter((park) => park.propertyType === propertyTypeFilter);
  }, [allParks, propertyTypeFilter]);

  const handleParkSelect = (park: MhCommunity | null) => {
    setSelectedPark(park);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MH Parks Map</h1>
          <p className="text-muted-foreground">
            Interactive map showing Mobile Home communities across Texas
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="property-type-filter" className="text-sm whitespace-nowrap">
              Property Type:
            </Label>
            <Select
              value={propertyTypeFilter}
              onValueChange={(value) => setPropertyTypeFilter(value as PropertyTypeFilter)}
            >
              <SelectTrigger id="property-type-filter" className="w-[140px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="all_ages">All Ages</SelectItem>
                <SelectItem value="senior_55+">Senior (55+)</SelectItem>
                <SelectItem value="family">Family</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm text-muted-foreground">
            {parks.length} parks{propertyTypeFilter !== 'all' ? ' (filtered)' : ''}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[500px] rounded-lg border border-dashed bg-muted/20 flex items-center justify-center">
          <p className="text-muted-foreground">Loading map data...</p>
        </div>
      ) : (
        <MhParkMap parks={parks} selectedPark={selectedPark} onParkSelect={handleParkSelect} />
      )}

      {selectedPark && (
        <div className="rounded-lg border p-4 bg-muted/10">
          <h2 className="font-semibold mb-2">Selected Park</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Name:</dt>
            <dd>{selectedPark.name}</dd>
            <dt className="text-muted-foreground">Location:</dt>
            <dd>
              {selectedPark.city}, {selectedPark.county} County
            </dd>
            {selectedPark.lotCount && (
              <>
                <dt className="text-muted-foreground">Lots:</dt>
                <dd>{selectedPark.lotCount}</dd>
              </>
            )}
            {selectedPark.estimatedOccupancy && (
              <>
                <dt className="text-muted-foreground">Occupancy:</dt>
                <dd>{Math.round(selectedPark.estimatedOccupancy * 100)}%</dd>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
