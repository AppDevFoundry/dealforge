'use client';

import type { MhCommunity } from '@dealforge/types';
import { Building2, Database, User, Users } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

interface ParkInfoGridProps {
  park: MhCommunity;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ParkInfoGrid({ park }: ParkInfoGridProps) {
  const occupancyPercent = park.estimatedOccupancy
    ? `${Math.round(park.estimatedOccupancy * 100)}%`
    : 'N/A';

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Lot Count"
        value={park.lotCount ?? 'N/A'}
        icon={<Building2 className="h-5 w-5" />}
      />
      <StatCard label="Occupancy" value={occupancyPercent} icon={<Users className="h-5 w-5" />} />
      <StatCard
        label="Owner"
        value={park.ownerName || 'Unknown'}
        icon={<User className="h-5 w-5" />}
      />
      <StatCard
        label="Source"
        value={park.source.toUpperCase()}
        icon={<Database className="h-5 w-5" />}
      />
    </div>
  );
}
