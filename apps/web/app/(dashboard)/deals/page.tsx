'use client';

import { DealCard } from '@/components/deals/deal-card';
import { DealCardSkeleton } from '@/components/deals/deal-card-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDeals } from '@/lib/hooks/use-deals';
import type { DealStatus, DealType } from '@dealforge/types';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function DealsPage() {
  const [typeFilter, setTypeFilter] = useState<DealType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'all'>('all');

  const { data, isLoading, error, refetch } = useDeals({
    type: typeFilter === 'all' ? undefined : typeFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    perPage: 20,
  });

  const deals = data?.data || [];
  const pagination = data?.meta?.pagination;

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight headline-premium">Deal Library</h1>
          <p className="text-muted-foreground">Manage and review your saved deal analyses</p>
        </div>
        <Button asChild>
          <Link href="/analyze">
            <Plus className="mr-2 h-4 w-4" />
            New Analysis
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search deals..." className="pl-9" disabled />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as DealType | 'all')}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Deal Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="rental">Rental</SelectItem>
            <SelectItem value="brrrr">BRRRR</SelectItem>
            <SelectItem value="flip">Flip</SelectItem>
            <SelectItem value="house_hack">House Hack</SelectItem>
            <SelectItem value="multifamily">Multi-family</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as DealStatus | 'all')}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="analyzing">Analyzing</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deals Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton placeholders
            <DealCardSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 rounded-xl border-2 border-dashed border-destructive/20 bg-destructive/5">
          <p className="text-destructive font-medium">Failed to load deals</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-12 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30">
          <div className="mx-auto max-w-md">
            <h3 className="text-lg font-semibold">No deals yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {typeFilter !== 'all' || statusFilter !== 'all'
                ? 'No deals match your current filters. Try adjusting them or create a new analysis.'
                : 'Your saved deal analyses will appear here. Start by analyzing a rental property, BRRRR deal, or flip.'}
            </p>
            <div className="mt-6 flex justify-center gap-4">
              {(typeFilter !== 'all' || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setTypeFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
              <Button asChild>
                <Link href="/analyze">
                  <Plus className="mr-2 h-4 w-4" />
                  Start Analyzing
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {deals.length} of {pagination.total} deals
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
