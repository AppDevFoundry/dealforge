'use client';

import { LeadIntelligencePanel } from '@/components/leads/lead-intelligence-panel';
import { LeadMapView } from '@/components/leads/lead-map-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLead } from '@/lib/hooks/use-leads';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const statusLabels: Record<string, string> = {
  new: 'New',
  analyzing: 'Analyzing...',
  analyzed: 'Analyzed',
  contacted: 'Contacted',
  archived: 'Archived',
};

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  analyzing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  analyzed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  contacted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export default function LeadDetailPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const { data, isLoading, error } = useLead(leadId);

  const handleDownloadReport = async () => {
    const res = await fetch(`/api/v1/leads/${leadId}/report`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lead-${leadId}-due-diligence.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="container py-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8 max-w-4xl mx-auto">
        <div className="text-center py-12 rounded-xl border-2 border-dashed border-destructive/20 bg-destructive/5">
          <p className="text-destructive font-medium">Failed to load lead</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/leads">Back to Leads</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { lead, intelligence, job } = data?.data || {};
  if (!lead) return null;

  return (
    <div className="container py-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/leads"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to Leads
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{lead.addressRaw}</h1>
            <div className="flex items-center gap-2 mt-1">
              {(lead.city || lead.county || lead.state) && (
                <span className="text-sm text-muted-foreground">
                  {[lead.city, lead.county, lead.state].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${statusColors[lead.status] || ''}`}>
              {statusLabels[lead.status] || lead.status}
            </Badge>
            {intelligence && (
              <Button variant="outline" size="sm" onClick={handleDownloadReport}>
                <Download className="mr-1.5 size-3.5" />
                PDF Report
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Created {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Map + Property Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Map */}
          {lead.latitude && lead.longitude && (
            <LeadMapView
              latitude={lead.latitude}
              longitude={lead.longitude}
              intelligence={intelligence}
            />
          )}

          {/* Property Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Property Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                {lead.propertyType && (
                  <div>
                    <p className="text-muted-foreground text-xs capitalize">Type</p>
                    <p className="font-medium capitalize">{lead.propertyType.replace('_', ' ')}</p>
                  </div>
                )}
                {lead.yearBuilt && (
                  <div>
                    <p className="text-muted-foreground text-xs">Year Built</p>
                    <p className="font-medium">{lead.yearBuilt}</p>
                  </div>
                )}
                {lead.acreage && (
                  <div>
                    <p className="text-muted-foreground text-xs">Acreage</p>
                    <p className="font-medium">{lead.acreage} ac</p>
                  </div>
                )}
                {lead.condition && (
                  <div>
                    <p className="text-muted-foreground text-xs capitalize">Condition</p>
                    <p className="font-medium capitalize">{lead.condition.replace('_', ' ')}</p>
                  </div>
                )}
                {lead.askingPrice && (
                  <div>
                    <p className="text-muted-foreground text-xs">Asking Price</p>
                    <p className="font-medium">${lead.askingPrice.toLocaleString()}</p>
                  </div>
                )}
                {lead.taxesOwed && (
                  <div>
                    <p className="text-muted-foreground text-xs">Taxes Owed</p>
                    <p className="font-medium text-amber-600 dark:text-amber-400">
                      ${lead.taxesOwed.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {lead.notes && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm mt-0.5">{lead.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seller Info */}
          {(lead.sellerName || lead.sellerPhone || lead.sellerMotivation) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Seller Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  {lead.sellerName && (
                    <div>
                      <p className="text-muted-foreground text-xs">Name</p>
                      <p>{lead.sellerName}</p>
                    </div>
                  )}
                  {lead.sellerPhone && (
                    <div>
                      <p className="text-muted-foreground text-xs">Phone</p>
                      <p>{lead.sellerPhone}</p>
                    </div>
                  )}
                  {lead.sellerMotivation && (
                    <div>
                      <p className="text-muted-foreground text-xs">Motivation</p>
                      <p>{lead.sellerMotivation}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Intelligence Panel */}
        <div className="space-y-4">
          {lead.status === 'analyzing' && !intelligence ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <Loader2 className="size-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Intelligence gathering in progress...
                  </p>
                  {job?.status === 'failed' && (
                    <p className="text-xs text-destructive">
                      {job.error_message || 'Analysis failed'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : intelligence ? (
            <LeadIntelligencePanel
              intelligence={intelligence}
              onDownloadReport={handleDownloadReport}
            />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-muted-foreground">No intelligence data available</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
