'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Table as UITable,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import type { TableElement } from '../types';

interface TableProps {
  data: Omit<TableElement, 'id' | 'type'>;
  className?: string;
}

function formatCellValue(value: string | number | null): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return value;
}

export function Table({ data, className }: TableProps) {
  const { title, columns, data: tableData, striped } = data;

  return (
    <Card className={cn('', className)}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <UITable>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center'
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row, rowIdx) => (
              <TableRow key={rowIdx} className={cn(striped && rowIdx % 2 === 1 && 'bg-muted/50')}>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center'
                    )}
                  >
                    {formatCellValue(row[col.key] ?? null)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </UITable>
      </CardContent>
    </Card>
  );
}
