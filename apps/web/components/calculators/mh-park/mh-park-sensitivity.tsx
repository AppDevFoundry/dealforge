'use client';

import type { MhParkInputs, MhParkResults } from '@dealforge/types';
import { useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { calculateMhParkMetrics } from '@/lib/calculations/mh-park';

interface MhParkSensitivityProps {
  inputs: MhParkInputs;
  occupancyOverride: number;
  rentOverride: number;
  onOccupancyChange: (value: number) => void;
  onRentChange: (value: number) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function MhParkSensitivity({
  inputs,
  occupancyOverride,
  rentOverride,
  onOccupancyChange,
  onRentChange,
}: MhParkSensitivityProps) {
  const sensitivityResults = useMemo((): MhParkResults => {
    return calculateMhParkMetrics({
      ...inputs,
      occupancyRate: occupancyOverride,
      averageLotRent: rentOverride,
    });
  }, [inputs, occupancyOverride, rentOverride]);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Sensitivity Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Occupancy Rate</span>
            <span className="font-medium tabular-nums">{occupancyOverride}%</span>
          </div>
          <Slider
            value={[occupancyOverride]}
            onValueChange={([val]) => onOccupancyChange(val!)}
            min={60}
            max={100}
            step={1}
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Average Lot Rent</span>
            <span className="font-medium tabular-nums">{formatCurrency(rentOverride)}</span>
          </div>
          <Slider
            value={[rentOverride]}
            onValueChange={([val]) => onRentChange(val!)}
            min={150}
            max={800}
            step={10}
          />
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Adjusted NOI</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(sensitivityResults.netOperatingIncome)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Adjusted Cash Flow</span>
            <span
              className={`font-medium tabular-nums ${
                sensitivityResults.annualCashFlow >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatCurrency(sensitivityResults.annualCashFlow)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Adjusted Cap Rate</span>
            <span className="font-medium tabular-nums">
              {sensitivityResults.capRate.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Adjusted DSCR</span>
            <span
              className={`font-medium tabular-nums ${
                sensitivityResults.debtServiceCoverageRatio >= 1.2
                  ? 'text-green-600 dark:text-green-400'
                  : sensitivityResults.debtServiceCoverageRatio >= 1.0
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
              }`}
            >
              {sensitivityResults.debtServiceCoverageRatio.toFixed(2)}x
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
