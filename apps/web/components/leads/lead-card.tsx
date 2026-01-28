'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Lead } from '@dealforge/types';
import { formatDistanceToNow } from 'date-fns';
import { MapPin } from 'lucide-react';
import Link from 'next/link';

interface LeadCardProps {
  lead: Lead & { hasIntelligence?: boolean };
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  analyzing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  analyzed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  contacted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const statusLabels: Record<string, string> = {
  new: 'New',
  analyzing: 'Analyzing...',
  analyzed: 'Analyzed',
  contacted: 'Contacted',
  archived: 'Archived',
};

export function LeadCard({ lead }: LeadCardProps) {
  const createdAgo = formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true });

  return (
    <Link href={`/leads/${lead.id}`} className="group">
      <Card className="h-full transition-[box-shadow,border-color] duration-200 hover:shadow-md hover:border-primary/40 cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base line-clamp-2">{lead.addressRaw}</CardTitle>
            <Badge
              variant="secondary"
              className={`text-xs shrink-0 ${statusColors[lead.status] || ''}`}
            >
              {statusLabels[lead.status] || lead.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {(lead.city || lead.county || lead.state) && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">
                {[lead.city, lead.county ? `${lead.county} Co.` : null, lead.state]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {lead.askingPrice ? (
              <span className="font-medium text-foreground">
                ${lead.askingPrice.toLocaleString()}
              </span>
            ) : (
              <span>No price</span>
            )}
            {lead.hasIntelligence && (
              <span className="text-emerald-600 dark:text-emerald-400">Intelligence available</span>
            )}
          </div>

          <div className="text-xs text-muted-foreground">Added {createdAgo}</div>
        </CardContent>
      </Card>
    </Link>
  );
}
