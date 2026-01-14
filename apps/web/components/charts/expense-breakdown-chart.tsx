'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { financialColors, tooltipStyles } from '@/lib/chart-theme';

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
  ].filter(item => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Expenses</CardTitle>
        </CardHeader>
        <CardContent className="flex h-48 items-center justify-center">
          <p className="text-sm text-muted-foreground">No expenses to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Monthly Expenses</CardTitle>
        <p className="text-2xl font-bold tabular-nums">{formatCurrency(total)}</p>
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
                      className="rounded-lg border bg-popover px-3 py-2 shadow-lg"
                      style={tooltipStyles.contentStyle}
                    >
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm tabular-nums">{formatCurrency(item.value)}</p>
                      <p className="text-xs text-muted-foreground">{percentage}% of total</p>
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value: string) => (
                  <span className="text-xs text-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
