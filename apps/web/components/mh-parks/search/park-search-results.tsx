'use client';

import type { MhCommunity } from '@dealforge/types';

import { Skeleton } from '@/components/ui/skeleton';

interface ParkSearchResultsProps {
  communities: MhCommunity[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function ParkSearchResults({
  communities,
  isLoading,
  page,
  totalPages,
  total,
  onPageChange,
}: ParkSearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={`skeleton-${i.toString()}`} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">No communities found matching your filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">{total.toLocaleString()} results</div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-2.5 px-3 font-medium">Name</th>
              <th className="text-left py-2.5 px-3 font-medium">City</th>
              <th className="text-left py-2.5 px-3 font-medium">County</th>
              <th className="text-right py-2.5 px-3 font-medium">Lots</th>
              <th className="text-left py-2.5 px-3 font-medium">Type</th>
              <th className="text-right py-2.5 px-3 font-medium">Occupancy</th>
            </tr>
          </thead>
          <tbody>
            {communities.map((community) => (
              <tr key={community.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="py-2.5 px-3 font-medium">{community.name}</td>
                <td className="py-2.5 px-3 text-muted-foreground">{community.city || '-'}</td>
                <td className="py-2.5 px-3">{community.county}</td>
                <td className="py-2.5 px-3 text-right tabular-nums">{community.lotCount ?? '-'}</td>
                <td className="py-2.5 px-3 capitalize">{community.propertyType}</td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  {community.estimatedOccupancy
                    ? `${Number(community.estimatedOccupancy).toFixed(0)}%`
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
