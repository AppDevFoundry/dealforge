'use client';

import { LeadCard } from '@/components/leads/lead-card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeads } from '@/lib/hooks/use-leads';
import type { LeadStatus } from '@dealforge/types';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function LeadsPage() {
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');

  const { data, isLoading, error, refetch } = useLeads({
    status: statusFilter === 'all' ? undefined : statusFilter,
    perPage: 20,
  });

  const leads = data?.data || [];
  const pagination = data?.meta?.pagination;

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight headline-premium">Leads</h1>
          <p className="text-muted-foreground">Track and analyze property acquisition leads</p>
        </div>
        <Button asChild>
          <Link href="/leads/new">
            <Plus className="mr-2 size-4" />
            New Lead
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as LeadStatus | 'all')}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="analyzing">Analyzing</SelectItem>
            <SelectItem value="analyzed">Analyzed</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {['sk-a', 'sk-b', 'sk-c', 'sk-d', 'sk-e', 'sk-f'].map((id) => (
            <div key={id} className="rounded-xl border bg-card p-4 space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 rounded-xl border-2 border-dashed border-destructive/20 bg-destructive/5">
          <p className="text-destructive font-medium">Failed to load leads</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30">
          <div className="mx-auto max-w-md">
            <h3 className="text-lg font-semibold">No leads yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {statusFilter !== 'all'
                ? 'No leads match this filter. Try a different status or clear the filter.'
                : 'Start tracking property leads. Each lead automatically gathers intelligence data.'}
            </p>
            <div className="mt-6 flex justify-center gap-4">
              {statusFilter !== 'all' && (
                <Button variant="outline" onClick={() => setStatusFilter('all')}>
                  Clear Filter
                </Button>
              )}
              <Button asChild>
                <Link href="/leads/new">
                  <Plus className="mr-2 size-4" />
                  Add Lead
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
          {pagination && (
            <p className="text-center text-sm text-muted-foreground">
              Showing {leads.length} of {pagination.total} leads
            </p>
          )}
        </>
      )}
    </div>
  );
}
