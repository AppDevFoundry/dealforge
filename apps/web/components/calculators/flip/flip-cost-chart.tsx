'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { tooltipStyles } from '@/lib/chart-theme';
import { formatCurrency } from '@/lib/formatters';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const FLIP_CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
] as const;

export interface FlipCostChartProps {
  closingCostsBuy: number;
  rehabCosts: number;
  holdingCosts: number;
  sellingCosts: number;
  loanCosts: number;
}

interface CostData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

export function FlipCostChart({
  closingCostsBuy,
  rehabCosts,
  holdingCosts,
  sellingCosts,
  loanCosts,
}: FlipCostChartProps) {
  const allItems: CostData[] = [
    { name: 'Purchase Closing', value: closingCostsBuy, color: FLIP_CHART_COLORS[0] as string },
    { name: 'Rehab', value: rehabCosts, color: FLIP_CHART_COLORS[1] as string },
    { name: 'Holding', value: holdingCosts, color: FLIP_CHART_COLORS[2] as string },
    { name: 'Selling', value: sellingCosts, color: FLIP_CHART_COLORS[3] as string },
    { name: 'Financing', value: loanCosts, color: FLIP_CHART_COLORS[4] as string },
  ];
  const data = allItems.filter((item) => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="text-base headline-premium">Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="flex h-48 items-center justify-center">
          <p className="text-sm text-muted-foreground">No costs to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-premium overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base headline-premium">Cost Breakdown</CardTitle>
        <p className="text-2xl font-bold tabular-nums metric-value">{formatCurrency(total)}</p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                stroke="hsl(var(--background))"
                strokeWidth={2}
                animationDuration={800}
                animationBegin={100}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as CostData;
                  const percentage = ((item.value / total) * 100).toFixed(1);
                  return (
                    <div
                      className="rounded-lg border bg-popover/95 backdrop-blur-sm px-3 py-2 shadow-xl"
                      style={tooltipStyles.contentStyle}
                    >
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-sm tabular-nums font-medium">
                        {formatCurrency(item.value)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{percentage}% of total</p>
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => (
                  <span className="text-xs text-foreground font-medium">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
