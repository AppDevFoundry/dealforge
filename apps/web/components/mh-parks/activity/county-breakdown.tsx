'use client';

import type { TitlingCountySummary } from '@dealforge/types';
import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { TrendIndicator } from './trend-indicator';

interface CountyBreakdownProps {
  data: TitlingCountySummary[];
}

type SortField = 'county' | 'newTitles' | 'transfers' | 'trend';

export function CountyBreakdown({ data }: CountyBreakdownProps) {
  const [sortField, setSortField] = useState<SortField>('newTitles');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sorted = [...data].sort((a, b) => {
    const multiplier = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'county') {
      return multiplier * a.county.localeCompare(b.county);
    }
    return multiplier * (a[sortField] - b[sortField]);
  });

  const headerBtnClass =
    'text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors w-full text-inherit';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">County Breakdown (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">
                  <button
                    type="button"
                    className={`${headerBtnClass} text-left`}
                    onClick={() => handleSort('county')}
                  >
                    County {sortField === 'county' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th className="text-right py-2 px-4">
                  <button
                    type="button"
                    className={`${headerBtnClass} text-right`}
                    onClick={() => handleSort('newTitles')}
                  >
                    New Titles {sortField === 'newTitles' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th className="text-right py-2 px-4">
                  <button
                    type="button"
                    className={`${headerBtnClass} text-right`}
                    onClick={() => handleSort('transfers')}
                  >
                    Transfers {sortField === 'transfers' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th className="text-right py-2 pl-4">
                  <button
                    type="button"
                    className={`${headerBtnClass} text-right`}
                    onClick={() => handleSort('trend')}
                  >
                    Trend {sortField === 'trend' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.county} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-2 pr-4 font-medium">{row.county}</td>
                  <td className="py-2 px-4 text-right tabular-nums">
                    {row.newTitles.toLocaleString()}
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums">
                    {row.transfers.toLocaleString()}
                  </td>
                  <td className="py-2 pl-4 text-right">
                    <TrendIndicator value={row.trend} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
