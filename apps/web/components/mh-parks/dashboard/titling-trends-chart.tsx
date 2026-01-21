'use client';

import type { TitlingTrendDataPoint } from '@dealforge/types';
import { format } from 'date-fns';
import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TitlingTrendsChartProps {
  titlings: TitlingTrendDataPoint[];
  isLoading?: boolean;
  selectedCounty?: string;
}

interface ChartDataPoint {
  month: string;
  monthLabel: string;
  [key: string]: string | number;
}

const COUNTY_COLORS: Record<string, string> = {
  Bexar: '#3b82f6',
  Hidalgo: '#10b981',
  Cameron: '#f59e0b',
  Nueces: '#8b5cf6',
  Travis: '#ef4444',
};

function getCountyColor(county: string): string {
  return COUNTY_COLORS[county] ?? '#6b7280';
}

export function TitlingTrendsChart({
  titlings,
  isLoading,
  selectedCounty,
}: TitlingTrendsChartProps) {
  const chartData = useMemo(() => {
    if (!titlings.length) return [];

    // Group by month
    const monthMap = new Map<string, ChartDataPoint>();

    for (const titling of titlings) {
      // TitlingTrendDataPoint.month is an ISO string
      const monthDate = new Date(titling.month);
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthLabel = format(monthDate, 'MMM yyyy');

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { month: monthKey, monthLabel });
      }

      const dataPoint = monthMap.get(monthKey)!;
      dataPoint[`${titling.county}_new`] = titling.newTitles;
      dataPoint[`${titling.county}_transfers`] = titling.transfers;
      dataPoint[`${titling.county}_total`] = titling.newTitles + titling.transfers;
    }

    // Sort by month and return array
    return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [titlings]);

  const counties = useMemo(() => {
    const countySet = new Set(titlings.map((t) => t.county));
    return Array.from(countySet).sort();
  }, [titlings]);

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

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Titling Activity Trends</CardTitle>
          <CardDescription>Monthly new titles and transfers by county</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No titling data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayCounties = selectedCounty ? [selectedCounty] : counties;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Titling Activity Trends</CardTitle>
        <CardDescription>
          {selectedCounty
            ? `Monthly new titles and transfers in ${selectedCounty} County`
            : 'Monthly new titles and transfers by county'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            {displayCounties.map((county) => (
              <Line
                key={county}
                type="monotone"
                dataKey={`${county}_total`}
                name={county}
                stroke={getCountyColor(county)}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
