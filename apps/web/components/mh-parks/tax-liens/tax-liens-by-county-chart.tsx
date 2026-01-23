'use client';

import type { TaxLienStats } from '@dealforge/types';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TaxLiensByCountyChartProps {
  stats: TaxLienStats | null | undefined;
  isLoading?: boolean;
}

const COUNTY_COLORS: Record<string, string> = {
  Bexar: '#3b82f6',
  Hidalgo: '#10b981',
  Cameron: '#f59e0b',
  Nueces: '#8b5cf6',
  Travis: '#ef4444',
};

export function TaxLiensByCountyChart({ stats, isLoading }: TaxLiensByCountyChartProps) {
  const chartData = useMemo(() => {
    if (!stats?.byCounty.length) return [];
    return stats.byCounty.map((item) => ({
      county: item.county,
      count: item.count,
      amount: item.amount,
      fill: COUNTY_COLORS[item.county] ?? '#6b7280',
    }));
  }, [stats]);

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
          <CardTitle>Active Tax Liens by County</CardTitle>
          <CardDescription>Distribution of active liens across Texas counties</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No tax lien data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Tax Liens by County</CardTitle>
        <CardDescription>Distribution of active liens across Texas counties</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="county" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value, name) => {
                const numValue = typeof value === 'number' ? value : 0;
                if (name === 'count') return [numValue.toLocaleString(), 'Liens'];
                if (name === 'amount') return [formatCurrency(numValue), 'Total Amount'];
                return [numValue, String(name)];
              }}
            />
            <Bar dataKey="count" name="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
