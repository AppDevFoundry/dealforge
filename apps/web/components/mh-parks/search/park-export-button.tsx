'use client';

import type { MhCommunity } from '@dealforge/types';
import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ParkExportButtonProps {
  communities: MhCommunity[];
  disabled?: boolean;
}

export function ParkExportButton({ communities, disabled }: ParkExportButtonProps) {
  const handleExport = () => {
    if (communities.length === 0) return;

    const headers = [
      'Name',
      'Address',
      'City',
      'County',
      'State',
      'Zip',
      'Lots',
      'Type',
      'Occupancy',
      'Owner',
    ];
    const rows = communities.map((c) => [
      c.name,
      c.address || '',
      c.city || '',
      c.county,
      c.state,
      c.zip || '',
      c.lotCount?.toString() || '',
      c.propertyType,
      c.estimatedOccupancy?.toString() || '',
      c.ownerName || '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mh-communities-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || communities.length === 0}
    >
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  );
}
