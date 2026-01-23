'use client';

import type { TitleActivity } from '@dealforge/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TitleActivityTableProps {
  titleActivity: TitleActivity[];
}

function getElectionTypeLabel(type: string): string {
  switch (type) {
    case 'PPNW':
      return 'Personal Property (No Wind)';
    case 'PPWZ':
      return 'Personal Property (Wind Zone)';
    case 'RPNW':
      return 'Real Property (No Wind)';
    case 'RPUD':
      return 'Real Property (Wind Zone)';
    default:
      return type || 'Unknown';
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function TitleActivityTable({ titleActivity }: TitleActivityTableProps) {
  if (titleActivity.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Title Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No title activity found for this community.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Title Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Certificate #</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Sale Date</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Issue Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {titleActivity.map((record) => (
              <TableRow key={record.certificateNumber}>
                <TableCell className="font-mono text-xs">{record.certificateNumber}</TableCell>
                <TableCell>{record.ownerName}</TableCell>
                <TableCell>{formatDate(record.saleDate)}</TableCell>
                <TableCell>{record.sellerName}</TableCell>
                <TableCell className="text-xs">
                  {getElectionTypeLabel(record.electionType)}
                </TableCell>
                <TableCell>{formatDate(record.issueDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
