'use client';

import type { TaxLienWithCommunity } from '@dealforge/types';
import { format } from 'date-fns';
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TaxLiensTableProps {
  liens: TaxLienWithCommunity[];
  isLoading?: boolean;
  counties: string[];
  selectedCounty: string | undefined;
  onCountyChange: (county: string | undefined) => void;
  selectedStatus: 'active' | 'released' | undefined;
  onStatusChange: (status: 'active' | 'released' | undefined) => void;
}

type SortField = 'county' | 'amount' | 'year' | 'filedDate';
type SortOrder = 'asc' | 'desc';

export function TaxLiensTable({
  liens,
  isLoading,
  counties,
  selectedCounty,
  onCountyChange,
  selectedStatus,
  onStatusChange,
}: TaxLiensTableProps) {
  const [sortField, setSortField] = useState<SortField>('filedDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const sortedLiens = [...liens].sort((a, b) => {
    let aVal: number | string | null;
    let bVal: number | string | null;

    switch (sortField) {
      case 'county':
        aVal = a.county;
        bVal = b.county;
        break;
      case 'amount':
        aVal = a.amount ?? 0;
        bVal = b.amount ?? 0;
        break;
      case 'year':
        aVal = a.year ?? 0;
        bVal = b.year ?? 0;
        break;
      case 'filedDate':
        aVal = a.filedDate ? new Date(a.filedDate).getTime() : 0;
        bVal = b.filedDate ? new Date(b.filedDate).getTime() : 0;
        break;
      default:
        return 0;
    }

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    return sortOrder === 'asc'
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '--';
    return format(new Date(date), 'MMM d, yyyy');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Tax Liens</CardTitle>
            <CardDescription>{liens.length} liens found</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select
              value={selectedCounty ?? 'all'}
              onValueChange={(v) => onCountyChange(v === 'all' ? undefined : v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Counties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Counties</SelectItem>
                {counties.map((county) => (
                  <SelectItem key={county} value={county}>
                    {county}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedStatus ?? 'all'}
              onValueChange={(v) =>
                onStatusChange(v === 'all' ? undefined : (v as 'active' | 'released'))
              }
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="released">Released</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedLiens.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No tax liens found
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-8 p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('county')}
                    >
                      County
                      <SortIcon field="county" />
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Serial #</TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      className="h-8 p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('amount')}
                    >
                      Amount
                      <SortIcon field="amount" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      className="h-8 p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('year')}
                    >
                      Year
                      <SortIcon field="year" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="h-8 p-0 font-semibold hover:bg-transparent"
                      onClick={() => handleSort('filedDate')}
                    >
                      Filed
                      <SortIcon field="filedDate" />
                    </Button>
                  </TableHead>
                  <TableHead>Community</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLiens.map((lien) => (
                  <TableRow key={lien.id}>
                    <TableCell className="font-medium">{lien.county}</TableCell>
                    <TableCell>
                      <Badge variant={lien.status === 'active' ? 'destructive' : 'secondary'}>
                        {lien.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{lien.serialNumber ?? '--'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(lien.amount)}</TableCell>
                    <TableCell className="text-right">{lien.year ?? '--'}</TableCell>
                    <TableCell>{formatDate(lien.filedDate)}</TableCell>
                    <TableCell>
                      {lien.community ? (
                        <Link
                          href={`/mh-parks/search?id=${lien.community.id}`}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          {lien.community.name}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
