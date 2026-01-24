'use client';

import type { DistressedParksQuery } from '@dealforge/types';
import { AlertTriangle, Download } from 'lucide-react';
import { useCallback, useState } from 'react';

import { DistressedParksFilters, DistressedParksTable } from '@/components/mh-parks/distressed';
import { Button } from '@/components/ui/button';
import { useDistressedParks, useTexasCounties } from '@/lib/hooks/use-mh-parks';

const DEFAULT_FILTERS: Partial<DistressedParksQuery> = {
  page: 1,
  perPage: 25,
  sortBy: 'score',
  sortOrder: 'desc',
  minScore: 20,
};

export default function DistressedParksPage() {
  const [filters, setFilters] = useState<Partial<DistressedParksQuery>>(DEFAULT_FILTERS);

  const { data: countiesData, isLoading: countiesLoading } = useTexasCounties();
  const { data, isLoading, error } = useDistressedParks(filters);

  const counties = countiesData ?? [];
  const parks = data?.data ?? [];
  const pagination = data?.meta?.pagination;

  const handleFiltersChange = useCallback((newFilters: Partial<DistressedParksQuery>) => {
    setFilters(newFilters);
  }, []);

  const handleSortChange = useCallback((sortBy: DistressedParksQuery['sortBy']) => {
    setFilters((prev) => {
      // Toggle sort order if clicking the same column
      const newOrder = prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc';
      return { ...prev, sortBy, sortOrder: newOrder, page: 1 };
    });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleExportCsv = useCallback(() => {
    if (!parks.length) return;

    const headers = [
      'Name',
      'Address',
      'City',
      'County',
      'Lot Count',
      'Distress Score',
      'Active Liens',
      'Total Tax Owed',
      'Tax Years with Liens',
      'Most Recent Lien Date',
    ];

    const rows = parks.map((park) => [
      park.name,
      park.address ?? '',
      park.city,
      park.county,
      park.lotCount ?? '',
      park.distressScore.toFixed(2),
      park.activeLienCount,
      park.totalTaxOwed.toFixed(2),
      park.taxYearsWithLiens,
      park.mostRecentLienDate ?? '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => (typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell))
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `distressed-parks-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [parks]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <h1 className="text-3xl font-bold tracking-tight">Distressed Parks</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Identify acquisition opportunities by analyzing tax lien signals and distress indicators
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCsv} disabled={!parks.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          Failed to load distressed parks. Please try again.
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Filters Sidebar */}
        <div className="space-y-6">
          <DistressedParksFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            counties={counties}
            isLoading={isLoading || countiesLoading}
          />

          {/* Score Legend */}
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-medium text-sm">Score Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>High (70-100): Significant distress signals</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span>Medium (40-69): Moderate distress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Low (20-39): Minor distress signals</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div>
          {pagination && (
            <p className="text-sm text-muted-foreground mb-4">
              Found <span className="font-medium">{pagination.total}</span> distressed parks
              {filters.county && (
                <span>
                  {' '}
                  in <span className="font-medium">{filters.county}</span> County
                </span>
              )}
            </p>
          )}

          <DistressedParksTable
            parks={parks}
            isLoading={isLoading}
            pagination={pagination}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            onSortChange={handleSortChange}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
}
