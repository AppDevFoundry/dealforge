'use client';

import type { TaxLienWithCommunity } from '@dealforge/types';
import { format, parseISO, startOfMonth } from 'date-fns';
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

interface TaxLiensTrendChartProps {
  liens: TaxLienWithCommunity[];
  isLoading?: boolean;
}

interface TrendDataPoint {
  month: string;
  monthLabel: string;
  filed: number;
  released: number;
}

export function TaxLiensTrendChart({ liens, isLoading }: TaxLiensTrendChartProps) {
  const chartData = useMemo(() => {
    if (!liens.length) return [];

    // Group liens by month based on filed/released dates
    const monthMap = new Map<string, TrendDataPoint>();

    for (const lien of liens) {
      // Count filed liens by filed date
      if (lien.filedDate) {
        const date = typeof lien.filedDate === 'string' ? parseISO(lien.filedDate) : lien.filedDate;
        const monthStart = startOfMonth(date);
        const monthKey = format(monthStart, 'yyyy-MM');
        const monthLabel = format(monthStart, 'MMM yyyy');

        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, { month: monthKey, monthLabel, filed: 0, released: 0 });
        }
        monthMap.get(monthKey)!.filed++;
      }

      // Count released liens by released date
      if (lien.releasedDate) {
        const date =
          typeof lien.releasedDate === 'string' ? parseISO(lien.releasedDate) : lien.releasedDate;
        const monthStart = startOfMonth(date);
        const monthKey = format(monthStart, 'yyyy-MM');
        const monthLabel = format(monthStart, 'MMM yyyy');

        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, { month: monthKey, monthLabel, filed: 0, released: 0 });
        }
        monthMap.get(monthKey)!.released++;
      }
    }

    // Sort by month and return array
    return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [liens]);

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
          <CardTitle>Lien Activity Trends</CardTitle>
          <CardDescription>Monthly filing and release activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No trend data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lien Activity Trends</CardTitle>
        <CardDescription>Monthly filing and release activity over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="monthLabel" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="filed"
              name="Filed"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="released"
              name="Released"
              stroke="#22c55e"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
