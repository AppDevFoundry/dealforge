'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { financialColors, tooltipStyles } from '@/lib/chart-theme';
import { formatCurrency } from '@/lib/formatters';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface ExpenseData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

interface ExpenseBreakdownChartProps {
  mortgage: number;
  propertyTaxes: number;
  insurance: number;
  maintenance: number;
  vacancy: number;
  capex: number;
  managementFees: number;
}

export function ExpenseBreakdownChart({
  mortgage,
  propertyTaxes,
  insurance,
  maintenance,
  vacancy,
  capex,
  managementFees,
}: ExpenseBreakdownChartProps) {
  const data: ExpenseData[] = [
    { name: 'Mortgage', value: mortgage, color: financialColors.mortgage },
    { name: 'Taxes', value: propertyTaxes, color: financialColors.taxes },
    { name: 'Insurance', value: insurance, color: financialColors.insurance },
    { name: 'Maintenance', value: maintenance, color: financialColors.maintenance },
    { name: 'Vacancy', value: vacancy, color: financialColors.vacancy },
    { name: 'CapEx', value: capex, color: financialColors.capex },
    { name: 'Management', value: managementFees, color: financialColors.management },
  ].filter((item) => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="text-base headline-premium">Monthly Expenses</CardTitle>
        </CardHeader>
        <CardContent className="flex h-48 items-center justify-center">
          <p className="text-sm text-muted-foreground">No expenses to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-premium overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base headline-premium">Monthly Expenses</CardTitle>
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
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as ExpenseData;
                  const percentage = ((item.value / total) * 100).toFixed(1);
                  return (
                    <div
                      className="rounded-lg border bg-popover/95 backdrop-blur-sm px-3 py-2 shadow-xl"
                      style={tooltipStyles.contentStyle}
                    >
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-sm tabular-nums font-medium">{formatCurrency(item.value)}</p>
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
