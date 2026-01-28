'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LeadStatus } from '@dealforge/types';

const statusConfig: Record<
  LeadStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  new: { label: 'New', variant: 'default' },
  analyzing: { label: 'Analyzing', variant: 'secondary' },
  analyzed: { label: 'Analyzed', variant: 'default' },
  interested: { label: 'Interested', variant: 'default' },
  passed: { label: 'Passed', variant: 'outline' },
  in_progress: { label: 'In Progress', variant: 'secondary' },
  closed: { label: 'Closed', variant: 'default' },
  dead: { label: 'Dead', variant: 'destructive' },
};

interface LeadStatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className={cn(
        status === 'new' && 'bg-blue-500 hover:bg-blue-600',
        status === 'analyzing' && 'bg-yellow-500 hover:bg-yellow-600 animate-pulse',
        status === 'analyzed' && 'bg-green-500 hover:bg-green-600',
        status === 'interested' && 'bg-purple-500 hover:bg-purple-600',
        status === 'in_progress' && 'bg-orange-500 hover:bg-orange-600',
        status === 'closed' && 'bg-emerald-500 hover:bg-emerald-600',
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
