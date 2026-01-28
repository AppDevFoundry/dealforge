'use client';

import type { Lead } from '@dealforge/types';
import { Calendar, DollarSign, Home, MapPin } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadStatusBadge } from './lead-status-badge';

interface LeadCardProps {
  lead: Lead;
}

export function LeadCard({ lead }: LeadCardProps) {
  const formattedDate = new Date(lead.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link href={`/leads/${lead.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-medium line-clamp-2">{lead.address}</CardTitle>
            <LeadStatusBadge status={lead.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Location */}
          {(lead.city || lead.county) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {[lead.city, lead.county].filter(Boolean).join(', ')}
                {lead.state && `, ${lead.state}`}
              </span>
            </div>
          )}

          {/* Property Type */}
          {lead.propertyType && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Home className="h-4 w-4 shrink-0" />
              <span className="capitalize">{lead.propertyType.replace(/_/g, ' ')}</span>
            </div>
          )}

          {/* Price */}
          {lead.askingPrice && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 shrink-0 text-green-600" />
              <span className="font-medium">${lead.askingPrice.toLocaleString()}</span>
            </div>
          )}

          {/* Date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <Calendar className="h-3 w-3" />
            <span>{formattedDate}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
