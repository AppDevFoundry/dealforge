'use client';

import type { TaxLienStats } from '@dealforge/types';
import { AlertTriangle, DollarSign, MapPin } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TaxLienStatsCardsProps {
  stats: TaxLienStats | null | undefined;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
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

export function TaxLienStatsCards({ stats, isLoading }: TaxLienStatsCardsProps) {
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
          title="Active Liens"
          value="--"
          icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
          description="No data available"
        />
        <StatCard
          title="Total Amount"
          value="--"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          description="No data available"
        />
        <StatCard
          title="Avg Amount"
          value="--"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          description="No data available"
        />
        <StatCard
          title="Top County"
          value="--"
          icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
          description="No data available"
        />
      </div>
    );
  }

  const topCounty = stats.byCounty[0];
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Active Liens"
        value={stats.totalActive.toLocaleString()}
        icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
        description={`${stats.totalReleased.toLocaleString()} released`}
      />
      <StatCard
        title="Total Amount"
        value={formatCurrency(stats.totalAmount)}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        description="In active liens"
      />
      <StatCard
        title="Avg Amount"
        value={formatCurrency(stats.avgAmount)}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        description="Per active lien"
      />
      <StatCard
        title="Top County"
        value={topCounty?.county ?? '--'}
        icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
        description={topCounty ? `${topCounty.count} active liens` : 'No data'}
      />
    </div>
  );
}
