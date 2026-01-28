'use client';

import { cn } from '@/lib/utils';

import type { StatsGroupElement } from '../types';
import { Stat } from './stat';

interface StatsGroupProps {
  data: Omit<StatsGroupElement, 'id' | 'type'>;
  className?: string;
}

export function StatsGroup({ data, className }: StatsGroupProps) {
  const { stats } = data;

  return (
    <div
      className={cn('grid gap-4', className)}
      style={{
        gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, minmax(0, 1fr))`,
      }}
    >
      {stats.map((stat, idx) => (
        <Stat key={idx} data={stat} />
      ))}
    </div>
  );
}
