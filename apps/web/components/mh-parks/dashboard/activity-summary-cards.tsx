'use client';

import type { MhParkStats } from '@dealforge/types';
import { Building2, Home, MapPin, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivitySummaryCardsProps {
  stats: MhParkStats | null | undefined;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
}

function StatCard({ title, value, icon, description, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp
              className={`h-4 w-4 ${trend.value >= 0 ? 'text-success' : 'text-destructive'}`}
            />
            <span
              className={`text-xs font-medium ${trend.value >= 0 ? 'text-success' : 'text-destructive'}`}
            >
              {trend.value >= 0 ? '+' : ''}
              {trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export function ActivitySummaryCards({ stats, isLoading }: ActivitySummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Parks"
          value="--"
          icon={<Home className="h-4 w-4 text-muted-foreground" />}
          description="No data available"
        />
        <StatCard
          title="Total Lots"
          value="--"
          icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
          description="No data available"
        />
        <StatCard
          title="Avg Occupancy"
          value="--"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          description="No data available"
        />
        <StatCard
          title="Counties"
          value="--"
          icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
          description="No data available"
        />
      </div>
    );
  }

  const avgOccupancy = stats.avgOccupancy
    ? `${Math.round(stats.avgOccupancy * 100)}%`
    : 'N/A';

  const avgLots = stats.totalLots && stats.totalParks
    ? Math.round(stats.totalLots / stats.totalParks)
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Parks"
        value={stats.totalParks.toLocaleString()}
        icon={<Home className="h-4 w-4 text-muted-foreground" />}
        description={`Across ${stats.countyCount ?? 'multiple'} counties`}
      />
      <StatCard
        title="Total Lots"
        value={stats.totalLots?.toLocaleString() ?? 'N/A'}
        icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
        description={`Avg ${avgLots} lots per park`}
      />
      <StatCard
        title="Avg Occupancy"
        value={avgOccupancy}
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        description="Estimated across all parks"
      />
      <StatCard
        title="Counties"
        value={stats.countyCount ?? '--'}
        icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
        description="Active Texas counties"
      />
    </div>
  );
}
