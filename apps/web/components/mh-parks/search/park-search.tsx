'use client';

import type { MhCommunity, MhParkSearchQuery } from '@dealforge/types';
import { Download, Search } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMhParks, useTexasCounties } from '@/lib/hooks/use-mh-parks';

import { ParkCard } from './park-card';
import { SearchFilters } from './search-filters';

/**
 * Convert parks data to CSV string
 */
function parksToCSV(parks: MhCommunity[]): string {
  const headers = [
    'Name',
    'Address',
    'City',
    'County',
    'State',
    'Zip Code',
    'Lot Count',
    'Occupancy %',
    'Property Type',
    'Owner Name',
    'Latitude',
    'Longitude',
  ];

  const rows = parks.map((park) => [
    park.name,
    park.address ?? '',
    park.city,
    park.county,
    park.state,
    park.zipCode ?? '',
    park.lotCount?.toString() ?? '',
    park.estimatedOccupancy != null ? Math.round(park.estimatedOccupancy * 100).toString() : '',
    park.propertyType ?? '',
    park.ownerName ?? '',
    park.latitude?.toString() ?? '',
    park.longitude?.toString() ?? '',
  ]);

  // Escape CSV fields that contain commas, quotes, or newlines
  const escapeField = (field: string) => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map(escapeField).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Trigger CSV download in browser
 */
function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

interface ParkSearchProps {
  onParkSelect?: (park: MhCommunity) => void;
  selectedParkId?: string | null;
}

export function ParkSearch({ onParkSelect, selectedParkId }: ParkSearchProps) {
  const [filters, setFilters] = useState<Partial<MhParkSearchQuery>>({
    page: 1,
    perPage: 20,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const [isExporting, setIsExporting] = useState(false);

  const { data: parksResponse, isLoading: isLoadingParks } = useMhParks(filters);
  const { data: counties = [], isLoading: isLoadingCounties } = useTexasCounties();

  const parks = parksResponse?.data ?? [];
  const pagination = parksResponse?.meta.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const currentPage = pagination?.page ?? 1;
  const totalParks = pagination?.total ?? 0;

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Export all filtered results to CSV
  const handleExport = useCallback(async () => {
    if (totalParks === 0) return;

    setIsExporting(true);
    try {
      // Build query string from current filters (excluding pagination)
      const params = new URLSearchParams();
      if (filters.county) params.set('county', filters.county);
      if (filters.city) params.set('city', filters.city);
      if (filters.minLots !== undefined) params.set('minLots', filters.minLots.toString());
      if (filters.maxLots !== undefined) params.set('maxLots', filters.maxLots.toString());
      if (filters.propertyType) params.set('propertyType', filters.propertyType);
      params.set('perPage', '1000'); // Get all results for export
      params.set('sortBy', filters.sortBy ?? 'name');
      params.set('sortOrder', filters.sortOrder ?? 'asc');

      const response = await fetch(`/api/v1/mh-parks?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch parks for export');

      const data = await response.json();
      const allParks = data.data as MhCommunity[];

      const csv = parksToCSV(allParks);
      const timestamp = new Date().toISOString().split('T')[0];
      const countyPart = filters.county ? `-${filters.county.toLowerCase()}` : '';
      downloadCSV(csv, `mh-parks${countyPart}-${timestamp}.csv`);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [filters, totalParks]);

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Filters Sidebar */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <SearchFilters
          filters={filters}
          onFiltersChange={setFilters}
          counties={counties}
          isLoading={isLoadingCounties}
        />
      </div>

      {/* Results */}
      <div className="space-y-4">
        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isLoadingParks ? (
                'Searching...'
              ) : (
                <>
                  {pagination?.total ?? 0} parks found
                  {filters.county && ` in ${filters.county} County`}
                </>
              )}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || totalParks === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>

        {/* Results Grid */}
        {isLoadingParks ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={`skeleton-${i}`} className="h-48" />
            ))}
          </div>
        ) : parks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No parks found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters or search criteria
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {parks.map((park) => (
                <ParkCard
                  key={park.id}
                  park={park}
                  onClick={onParkSelect}
                  isSelected={selectedParkId === park.id}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
