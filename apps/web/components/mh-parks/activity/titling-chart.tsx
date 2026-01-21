'use client';

import type { TitlingMonthlyTotal } from '@dealforge/types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TitlingChartProps {
  data: TitlingMonthlyTotal[];
}

export function TitlingChart({ data }: TitlingChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    month: new Date(d.month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Monthly Titling Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--card))',
                }}
              />
              <Legend />
              <Bar
                dataKey="newTitles"
                name="New Titles"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="transfers"
                name="Transfers"
                fill="hsl(var(--primary) / 0.5)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
