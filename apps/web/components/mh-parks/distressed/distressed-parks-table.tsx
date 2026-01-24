'use client';

import type { DistressedParkResult } from '@dealforge/types';
import Link from 'next/link';
import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  parks: DistressedParkResult[];
  isLoading?: boolean;
}

type SortField =
  | 'distressScore'
  | 'name'
  | 'county'
  | 'activeLienCount'
  | 'totalTaxOwed'
  | 'lotCount';
type SortDirection = 'asc' | 'desc';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function DistressedParksTable({ parks, isLoading }: DistressedParksTableProps) {
  const [sortField, setSortField] = useState<SortField>('distressScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedParks = [...parks].sort((a, b) => {
    const dir = sortDirection === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'distressScore':
        return (a.distressScore - b.distressScore) * dir;
      case 'name':
        return a.name.localeCompare(b.name) * dir;
      case 'county':
        return a.county.localeCompare(b.county) * dir;
      case 'activeLienCount':
        return (a.distressFactors.activeLienCount - b.distressFactors.activeLienCount) * dir;
      case 'totalTaxOwed':
        return (a.distressFactors.totalTaxOwed - b.distressFactors.totalTaxOwed) * dir;
      case 'lotCount':
        return ((a.lotCount ?? 0) - (b.lotCount ?? 0)) * dir;
      default:
        return 0;
    }
  });

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' \u2191' : ' \u2193';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distressed Parks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {['a', 'b', 'c', 'd', 'e'].map((key) => (
            <Skeleton key={key} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (parks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distressed Parks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No distressed parks found matching the current filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distressed Parks ({parks.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('distressScore')}
              >
                Score{sortIndicator('distressScore')}
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                Park Name{sortIndicator('name')}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('county')}
              >
                County{sortIndicator('county')}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort('activeLienCount')}
              >
                Active Liens{sortIndicator('activeLienCount')}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort('totalTaxOwed')}
              >
                Tax Owed{sortIndicator('totalTaxOwed')}
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort('lotCount')}
              >
                Lots{sortIndicator('lotCount')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedParks.map((park) => (
              <TableRow key={park.communityId} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link href={`/mh-parks/${park.communityId}`}>
                    <DistressScoreBadge score={park.distressScore} />
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/mh-parks/${park.communityId}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {park.name}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{park.county}</TableCell>
                <TableCell className="text-right text-sm">
                  {park.distressFactors.activeLienCount}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {currencyFormatter.format(park.distressFactors.totalTaxOwed)}
                </TableCell>
                <TableCell className="text-right text-sm">{park.lotCount ?? 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
