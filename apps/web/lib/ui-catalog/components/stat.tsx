'use client';

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  DollarSign,
  Home,
  Minus,
  Percent,
  Users,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import type { StatElement } from '../types';

const iconMap = {
  dollar: DollarSign,
  percent: Percent,
  home: Home,
  users: Users,
  chart: BarChart3,
  alert: AlertTriangle,
};

interface StatProps {
  data: Omit<StatElement, 'id' | 'type'>;
  className?: string;
}

export function Stat({ data, className }: StatProps) {
  const { label, value, unit, change, icon } = data;
  const Icon = icon ? iconMap[icon] : null;

  const formattedValue =
    typeof value === 'number'
      ? unit === '$'
        ? `$${value.toLocaleString()}`
        : unit === '%'
          ? `${value}%`
          : value.toLocaleString()
      : value;

  return (
    <Card className={cn('', className)}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <p className="text-2xl font-bold">
            {unit && unit !== '$' && unit !== '%' ? `${formattedValue} ${unit}` : formattedValue}
          </p>
          {change && (
            <div
              className={cn(
                'flex items-center text-sm',
                change.direction === 'up' && 'text-green-600',
                change.direction === 'down' && 'text-red-600',
                change.direction === 'neutral' && 'text-muted-foreground'
              )}
            >
              {change.direction === 'up' && <ArrowUp className="h-3 w-3" />}
              {change.direction === 'down' && <ArrowDown className="h-3 w-3" />}
              {change.direction === 'neutral' && <Minus className="h-3 w-3" />}
              <span className="ml-1">
                {change.value}%{change.period && ` ${change.period}`}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
