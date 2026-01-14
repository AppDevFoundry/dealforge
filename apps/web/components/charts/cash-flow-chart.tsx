'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { chartColors, tooltipStyles } from '@/lib/chart-theme';
import { formatCurrency } from '@/lib/formatters';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface CashFlowDataPoint {
  year: number;
  cashFlow: number;
  equity: number;
  [key: string]: string | number;
}

interface CashFlowChartProps {
  annualCashFlow: number;
  totalInvestment: number;
  loanAmount: number;
  purchasePrice: number;
  appreciationRate?: number;
  cashFlowGrowthRate?: number;
}

function generateProjection({
  annualCashFlow,
  totalInvestment,
  loanAmount,
  purchasePrice,
  appreciationRate = 3,
  cashFlowGrowthRate = 2,
}: CashFlowChartProps): CashFlowDataPoint[] {
  const data: CashFlowDataPoint[] = [];
  let currentCashFlow = annualCashFlow;
  let currentPropertyValue = purchasePrice;
  let currentLoanBalance = loanAmount;

  // Assume 30-year mortgage at ~7% for principal paydown estimation
  const monthlyRate = 0.07 / 12;
  const monthlyPayment =
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, 360))) /
    (Math.pow(1 + monthlyRate, 360) - 1);

  for (let year = 0; year <= 10; year++) {
    // Calculate equity: property value - remaining loan balance
    const equity = currentPropertyValue - currentLoanBalance + (year === 0 ? totalInvestment : 0);

    data.push({
      year,
      cashFlow: Math.round(year === 0 ? 0 : currentCashFlow),
      equity: Math.round(equity),
    });

    // Project forward
    currentCashFlow *= 1 + cashFlowGrowthRate / 100;
    currentPropertyValue *= 1 + appreciationRate / 100;

    // Approximate principal paydown for the year
    let yearlyPrincipal = 0;
    for (let month = 0; month < 12; month++) {
      const interestPayment = currentLoanBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      yearlyPrincipal += principalPayment;
      currentLoanBalance -= principalPayment;
    }
  }

  return data;
}

export function CashFlowChart(props: CashFlowChartProps) {
  const data = generateProjection(props);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">10-Year Projection</CardTitle>
        <p className="text-sm text-muted-foreground">Cash flow and equity growth over time</p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="cashFlowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.positive} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColors.positive} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="year"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => `Y${value}`}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                width={50}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div
                      className="rounded-lg border bg-popover px-3 py-2 shadow-lg"
                      style={tooltipStyles.contentStyle}
                    >
                      <p className="mb-1 font-medium">Year {label}</p>
                      {payload.map((entry, index) => (
                        <p
                          key={index}
                          className="text-sm tabular-nums"
                          style={{ color: entry.color }}
                        >
                          {entry.name}: {formatCurrency(entry.value as number)}
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="equity"
                name="Total Equity"
                stroke={chartColors.primary}
                strokeWidth={2}
                fill="url(#equityGradient)"
              />
              <Area
                type="monotone"
                dataKey="cashFlow"
                name="Annual Cash Flow"
                stroke={chartColors.positive}
                strokeWidth={2}
                fill="url(#cashFlowGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full" style={{ backgroundColor: chartColors.primary }} />
            <span className="text-muted-foreground">Equity</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="size-3 rounded-full"
              style={{ backgroundColor: chartColors.positive }}
            />
            <span className="text-muted-foreground">Cash Flow</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
