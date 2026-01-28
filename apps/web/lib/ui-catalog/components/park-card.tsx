'use client';

import { AlertTriangle, Home, MapPin } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import type { ParkCardElement } from '../types';

interface ParkCardProps {
  data: Omit<ParkCardElement, 'id' | 'type'>;
  className?: string;
  onClick?: () => void;
}

function getDistressLabel(score: number): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive';
} {
  if (score >= 70) return { label: 'High Distress', variant: 'destructive' };
  if (score >= 40) return { label: 'Moderate', variant: 'secondary' };
  return { label: 'Low Risk', variant: 'default' };
}

export function ParkCard({ data, className, onClick }: ParkCardProps) {
  const { name, address, city, county, distressScore, lotCount, totalTaxOwed, clickable } = data;
  const distress =
    distressScore !== null && distressScore !== undefined ? getDistressLabel(distressScore) : null;

  return (
    <Card
      className={cn(
        'transition-colors',
        (onClick || clickable) && 'cursor-pointer hover:bg-muted/50',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base leading-tight">{name}</CardTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {address}, {city}
            </p>
            <p className="text-xs text-muted-foreground">{county} County</p>
          </div>
          {distress && (
            <Badge variant={distress.variant} className="shrink-0">
              {distress.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {lotCount !== null && lotCount !== undefined && (
            <div>
              <p className="text-xs text-muted-foreground">Lots</p>
              <p className="text-sm font-semibold flex items-center gap-1">
                <Home className="h-3 w-3" />
                {lotCount}
              </p>
            </div>
          )}
          {totalTaxOwed !== undefined && totalTaxOwed > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Tax Owed</p>
              <p className="text-sm font-semibold text-red-600">${totalTaxOwed.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Distress Score Bar */}
        {distressScore !== null && distressScore !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Distress Score</span>
              <span className="font-medium">{distressScore}/100</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  distressScore >= 70
                    ? 'bg-red-500'
                    : distressScore >= 40
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                )}
                style={{ width: `${distressScore}%` }}
              />
            </div>
          </div>
        )}

        {/* Tax warning */}
        {totalTaxOwed !== undefined && totalTaxOwed > 5000 && (
          <div className="pt-2 border-t">
            <Badge variant="outline" className="text-xs text-amber-600">
              <AlertTriangle className="h-2 w-2 mr-1" />
              Significant tax delinquency
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
