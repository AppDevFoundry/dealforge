'use client';

import type { DistressedParkWithScore, DistressedParksQuery } from '@dealforge/types';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DistressScoreBadge } from './distress-score-badge';

interface DistressedParksTableProps {
  parks: DistressedParkWithScore[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  sortBy?: DistressedParksQuery['sortBy'];
  sortOrder?: DistressedParksQuery['sortOrder'];
  onSortChange?: (sortBy: DistressedParksQuery['sortBy']) => void;
  onPageChange?: (page: number) => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Park Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>County</TableHead>
              <TableHead className="text-right">Lots</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-right">Active Liens</TableHead>
              <TableHead className="text-right">Tax Owed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-36" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-24" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-5 w-10 ml-auto" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-6 w-16 ml-auto" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-5 w-10 ml-auto" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-5 w-20 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function DistressedParksTable({
  parks,
  isLoading,
  pagination,
  sortBy = 'score',
  sortOrder = 'desc',
  onSortChange,
  onPageChange,
}: DistressedParksTableProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const handleSort = (column: DistressedParksQuery['sortBy']) => {
    onSortChange?.(column);
  };

  const getSortIcon = (column: DistressedParksQuery['sortBy']) => {
    if (sortBy === column) {
      return (
        <ArrowUpDown className={`ml-1 h-4 w-4 inline ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
      );
    }
    return <ArrowUpDown className="ml-1 h-4 w-4 inline opacity-30" />;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Park Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>County</TableHead>
              <TableHead className="text-right">Lots</TableHead>
              <TableHead className="text-right">
                <button
                  type="button"
                  className="hover:text-foreground transition-colors"
                  onClick={() => handleSort('score')}
                >
                  Score
                  {getSortIcon('score')}
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  type="button"
                  className="hover:text-foreground transition-colors"
                  onClick={() => handleSort('lienCount')}
                >
                  Active Liens
                  {getSortIcon('lienCount')}
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  type="button"
                  className="hover:text-foreground transition-colors"
                  onClick={() => handleSort('taxOwed')}
                >
                  Tax Owed
                  {getSortIcon('taxOwed')}
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No distressed parks found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              parks.map((park) => (
                <TableRow key={park.communityId} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link
                      href={`/mh-parks/${park.communityId}`}
                      className="hover:underline text-primary"
                    >
                      {park.name}
                    </Link>
                  </TableCell>
                  <TableCell>{park.city}</TableCell>
                  <TableCell>{park.county}</TableCell>
                  <TableCell className="text-right">{park.lotCount ?? '-'}</TableCell>
                  <TableCell className="text-right">
                    <DistressScoreBadge score={park.distressScore} size="sm" />
                  </TableCell>
                  <TableCell className="text-right">{park.activeLienCount}</TableCell>
                  <TableCell className="text-right">{formatCurrency(park.totalTaxOwed)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.perPage + 1} to{' '}
            {Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total}{' '}
            results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
