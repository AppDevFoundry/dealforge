'use client';

import type { MhCommunity, TitlingTrendDataPoint } from '@dealforge/types';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CountyComparisonTableProps {
  parks: MhCommunity[];
  titlings: TitlingTrendDataPoint[];
  isLoading?: boolean;
}

interface CountyData {
  name: string;
  parkCount: number;
  totalLots: number;
  avgOccupancy: number | null;
  recentTitlings: number;
}

type SortField = 'name' | 'parkCount' | 'totalLots' | 'avgOccupancy' | 'recentTitlings';
type SortOrder = 'asc' | 'desc';

export function CountyComparisonTable({ parks, titlings, isLoading }: CountyComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField>('parkCount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const countyData = useMemo(() => {
    const countyMap = new Map<string, CountyData>();

    // Aggregate park data by county
    for (const park of parks) {
      if (!countyMap.has(park.county)) {
        countyMap.set(park.county, {
          name: park.county,
          parkCount: 0,
          totalLots: 0,
          avgOccupancy: null,
          recentTitlings: 0,
        });
      }

      const county = countyMap.get(park.county)!;
      county.parkCount++;
      county.totalLots += park.lotCount ?? 0;
    }

    // Calculate average occupancy per county
    for (const [countyName, data] of countyMap) {
      const countyParks = parks.filter((p) => p.county === countyName);
      const parksWithOccupancy = countyParks.filter((p) => p.estimatedOccupancy != null);
      if (parksWithOccupancy.length > 0) {
        const totalOccupancy = parksWithOccupancy.reduce(
          (sum, p) => sum + (p.estimatedOccupancy ?? 0),
          0
        );
        data.avgOccupancy = totalOccupancy / parksWithOccupancy.length;
      }
    }

    // Add recent titling data (last 3 months)
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    for (const titling of titlings) {
      // TitlingTrendDataPoint.month is an ISO string
      const titlingDate = new Date(titling.month);
      if (titlingDate >= threeMonthsAgo && countyMap.has(titling.county)) {
        const county = countyMap.get(titling.county)!;
        county.recentTitlings += titling.newTitles + titling.transfers;
      }
    }

    return Array.from(countyMap.values());
  }, [parks, titlings]);

  const sortedData = useMemo(() => {
    return [...countyData].sort((a, b) => {
      let aVal: number | string | null;
      let bVal: number | string | null;

      switch (sortField) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'parkCount':
          aVal = a.parkCount;
          bVal = b.parkCount;
          break;
        case 'totalLots':
          aVal = a.totalLots;
          bVal = b.totalLots;
          break;
        case 'avgOccupancy':
          aVal = a.avgOccupancy ?? -1;
          bVal = b.avgOccupancy ?? -1;
          break;
        case 'recentTitlings':
          aVal = a.recentTitlings;
          bVal = b.recentTitlings;
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
  }, [countyData, sortField, sortOrder]);

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!sortedData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>County Comparison</CardTitle>
          <CardDescription>Compare MH park metrics across Texas counties</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No county data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>County Comparison</CardTitle>
        <CardDescription>Compare MH park metrics across Texas counties</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  className="h-8 p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('name')}
                >
                  County
                  <SortIcon field="name" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  className="h-8 p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('parkCount')}
                >
                  Parks
                  <SortIcon field="parkCount" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  className="h-8 p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('totalLots')}
                >
                  Total Lots
                  <SortIcon field="totalLots" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  className="h-8 p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('avgOccupancy')}
                >
                  Avg Occupancy
                  <SortIcon field="avgOccupancy" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  className="h-8 p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('recentTitlings')}
                >
                  Recent Titlings
                  <SortIcon field="recentTitlings" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((county) => (
              <TableRow key={county.name}>
                <TableCell className="font-medium">{county.name}</TableCell>
                <TableCell className="text-right">{county.parkCount}</TableCell>
                <TableCell className="text-right">{county.totalLots.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  {county.avgOccupancy != null
                    ? `${Math.round(county.avgOccupancy * 100)}%`
                    : 'N/A'}
                </TableCell>
                <TableCell className="text-right">{county.recentTitlings}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
