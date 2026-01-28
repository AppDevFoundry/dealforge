'use client';

import { Filter, Loader2, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { LeadCard } from '@/components/leads/lead-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLeads } from '@/lib/hooks/use-leads';
import type { LeadStatus, PropertyType } from '@dealforge/types';

const STATUS_OPTIONS: { value: LeadStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'analyzing', label: 'Analyzing' },
  { value: 'analyzed', label: 'Analyzed' },
  { value: 'interested', label: 'Interested' },
  { value: 'passed', label: 'Passed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'closed', label: 'Closed' },
  { value: 'dead', label: 'Dead' },
];

const PROPERTY_TYPE_OPTIONS: { value: PropertyType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'singlewide', label: 'Singlewide' },
  { value: 'doublewide', label: 'Doublewide' },
  { value: 'land_only', label: 'Land Only' },
  { value: 'land_with_home', label: 'Land with Home' },
  { value: 'park', label: 'MH Park' },
  { value: 'other', label: 'Other' },
];

export default function LeadsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<LeadStatus | 'all'>('all');
  const [propertyType, setPropertyType] = useState<PropertyType | 'all'>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useLeads({
    search: search || undefined,
    status: status === 'all' ? undefined : status,
    propertyType: propertyType === 'all' ? undefined : propertyType,
    page,
    perPage: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const leads = data?.data ?? [];
  const pagination = data?.meta?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">
            Manage your property leads and due diligence reports
          </p>
        </div>
        <Button asChild>
          <Link href="/leads/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by address, city, or seller..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as LeadStatus | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={propertyType}
            onValueChange={(value) => {
              setPropertyType(value as PropertyType | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load leads. Please try again.</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No leads found</p>
          <Button asChild>
            <Link href="/leads/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Lead
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
