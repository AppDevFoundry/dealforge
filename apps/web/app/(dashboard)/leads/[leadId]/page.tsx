'use client';

import {
  AlertTriangle,
  ArrowLeft,
  Building,
  CheckCircle,
  DollarSign,
  Download,
  Droplets,
  Edit,
  FileText,
  Home,
  Loader2,
  MapPin,
  RefreshCw,
  TrendingUp,
  User,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

import { AnalyzingOverlay } from '@/components/leads/analyzing-overlay';
import { LeadLocationMap } from '@/components/leads/detail/lead-location-map';
import { LeadStatusBadge } from '@/components/leads/lead-status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAnalyzeLead, useGenerateReport, useLead } from '@/lib/hooks/use-leads';

interface PageProps {
  params: Promise<{ leadId: string }>;
}

export default function LeadDetailPage({ params }: PageProps) {
  const { leadId } = use(params);
  const { data, isLoading, error } = useLead(leadId);
  const analyzeLead = useAnalyzeLead();
  const generateReport = useGenerateReport();

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="container py-6">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load lead. Please try again.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/leads">Back to Leads</Link>
          </Button>
        </div>
      </div>
    );
  }

  const lead = data.data;
  const intelligence = lead.intelligence;

  const handleReanalyze = async () => {
    await analyzeLead.mutateAsync(leadId);
  };

  const handleGenerateReport = async () => {
    const result = await generateReport.mutateAsync({ id: leadId });
    if (result.data.downloadUrl) {
      window.open(result.data.downloadUrl, '_blank');
    }
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/leads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leads
          </Link>
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{lead.address}</h1>
              <LeadStatusBadge status={lead.status} />
            </div>
            {(lead.city || lead.county) && (
              <p className="text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {[lead.city, lead.county, lead.state].filter(Boolean).join(', ')}
                {lead.zipCode && ` ${lead.zipCode}`}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/leads/${leadId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={handleReanalyze}
              disabled={analyzeLead.isPending || lead.status === 'analyzing'}
            >
              {analyzeLead.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Re-Analyze
            </Button>
            <Button onClick={handleGenerateReport} disabled={generateReport.isPending}>
              {generateReport.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      {/* Analyzing overlay - shown while intelligence is being gathered */}
      {lead.status === 'analyzing' && <AnalyzingOverlay intelligence={intelligence} />}

      {/* Location Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeadLocationMap
            latitude={lead.latitude}
            longitude={lead.longitude}
            address={lead.address}
            intelligence={intelligence}
          />
        </CardContent>
      </Card>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Property & Financials */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoItem label="Type" value={lead.propertyType?.replace(/_/g, ' ')} capitalize />
                <InfoItem
                  label="Condition"
                  value={lead.propertyCondition?.replace(/_/g, ' ')}
                  capitalize
                />
                <InfoItem label="Year Built" value={lead.yearBuilt?.toString()} />
                <InfoItem
                  label="Lot Size"
                  value={lead.lotSize ? `${lead.lotSize} acres` : undefined}
                />
                <InfoItem
                  label="Home Size"
                  value={lead.homeSize ? `${lead.homeSize} sq ft` : undefined}
                />
                <InfoItem label="Bedrooms" value={lead.bedrooms?.toString()} />
                <InfoItem label="Bathrooms" value={lead.bathrooms?.toString()} />
                <InfoItem label="Lot Count" value={lead.lotCount?.toString()} />
              </div>
            </CardContent>
          </Card>

          {/* Financials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoItem
                  label="Asking Price"
                  value={lead.askingPrice ? `$${lead.askingPrice.toLocaleString()}` : undefined}
                />
                <InfoItem
                  label="Estimated Value"
                  value={
                    lead.estimatedValue ? `$${lead.estimatedValue.toLocaleString()}` : undefined
                  }
                />
                <InfoItem
                  label="Monthly Lot Rent"
                  value={lead.lotRent ? `$${lead.lotRent.toLocaleString()}` : undefined}
                />
                <InfoItem
                  label="Monthly Income"
                  value={lead.monthlyIncome ? `$${lead.monthlyIncome.toLocaleString()}` : undefined}
                />
                <InfoItem
                  label="Annual Taxes"
                  value={lead.annualTaxes ? `$${lead.annualTaxes.toLocaleString()}` : undefined}
                />
                <InfoItem
                  label="Annual Insurance"
                  value={
                    lead.annualInsurance ? `$${lead.annualInsurance.toLocaleString()}` : undefined
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Seller Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Seller Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoItem label="Name" value={lead.sellerName} />
                <InfoItem label="Phone" value={lead.sellerPhone} />
                <InfoItem label="Email" value={lead.sellerEmail} />
                <InfoItem
                  label="Lead Source"
                  value={lead.leadSource?.replace(/_/g, ' ')}
                  capitalize
                />
              </div>
              {lead.sellerMotivation && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Motivation</p>
                  <p className="text-sm">{lead.sellerMotivation}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {lead.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* AI Analysis */}
          {intelligence?.aiAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  AI Analysis
                </CardTitle>
                <CardDescription>
                  {intelligence.aiAnalyzedAt &&
                    `Analyzed ${new Date(intelligence.aiAnalyzedAt).toLocaleDateString()}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Recommendation */}
                <div className="flex items-center gap-2">
                  <span className="font-medium">Recommendation:</span>
                  <Badge
                    variant={
                      intelligence.aiAnalysis.recommendation === 'pursue'
                        ? 'default'
                        : intelligence.aiAnalysis.recommendation === 'pass'
                          ? 'destructive'
                          : 'secondary'
                    }
                    className={
                      intelligence.aiAnalysis.recommendation === 'pursue'
                        ? 'bg-green-500'
                        : undefined
                    }
                  >
                    {intelligence.aiAnalysis.recommendation.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </div>

                {/* Summary */}
                <div>
                  <p className="text-sm">{intelligence.aiAnalysis.summary}</p>
                </div>

                <Separator />

                {/* Insights */}
                {intelligence.aiAnalysis.insights?.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Key Insights</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {intelligence.aiAnalysis.insights.map((insight, i) => (
                        <li key={i}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risks */}
                {intelligence.aiAnalysis.risks?.length > 0 && (
                  <div>
                    <p className="font-medium mb-2 text-destructive">Risks</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {intelligence.aiAnalysis.risks.map((risk, i) => (
                        <li key={i}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Opportunities */}
                {intelligence.aiAnalysis.opportunities?.length > 0 && (
                  <div>
                    <p className="font-medium mb-2 text-green-600">Opportunities</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {intelligence.aiAnalysis.opportunities.map((opp, i) => (
                        <li key={i}>{opp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Pricing */}
                {(intelligence.aiAnalysis.estimatedARV ||
                  intelligence.aiAnalysis.suggestedOffer) && (
                  <>
                    <Separator />
                    <div className="flex gap-8">
                      {intelligence.aiAnalysis.estimatedARV && (
                        <div>
                          <p className="text-sm text-muted-foreground">Estimated ARV</p>
                          <p className="text-lg font-semibold">
                            ${intelligence.aiAnalysis.estimatedARV.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {intelligence.aiAnalysis.suggestedOffer && (
                        <div>
                          <p className="text-sm text-muted-foreground">Suggested Offer</p>
                          <p className="text-lg font-semibold text-green-600">
                            ${intelligence.aiAnalysis.suggestedOffer.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Intelligence */}
        <div className="space-y-6">
          {/* Utilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Droplets className="h-5 w-5" />
                Utilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <UtilityStatus
                label="Water"
                hasCoverage={intelligence?.hasWaterCoverage}
                provider={intelligence?.waterCcn?.utilityName}
              />
              <UtilityStatus
                label="Sewer"
                hasCoverage={intelligence?.hasSewerCoverage}
                provider={intelligence?.sewerCcn?.utilityName}
              />
            </CardContent>
          </Card>

          {/* Flood Zone */}
          {intelligence?.floodZone && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Flood Zone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant={intelligence.isHighRiskFlood ? 'destructive' : 'secondary'}>
                    {intelligence.floodZone}
                  </Badge>
                  {intelligence.isHighRiskFlood && (
                    <span className="text-sm text-destructive">High Risk</span>
                  )}
                </div>
                {intelligence.floodZoneDescription && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {intelligence.floodZoneDescription}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Fair Market Rent */}
          {intelligence?.fmrData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Fair Market Rent ({intelligence.fmrData.year})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {intelligence.fmrData.twoBr && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">2BR FMR</span>
                    <span className="font-medium">${intelligence.fmrData.twoBr}/mo</span>
                  </div>
                )}
                {intelligence.fmrData.twoBr && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Est. Lot Rent</span>
                    <span className="font-medium">
                      ${Math.round(intelligence.fmrData.twoBr * 0.3)}-$
                      {Math.round(intelligence.fmrData.twoBr * 0.4)}/mo
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Demographics */}
          {intelligence?.demographics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Demographics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {intelligence.demographics.population && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Population</span>
                    <span>{intelligence.demographics.population.toLocaleString()}</span>
                  </div>
                )}
                {intelligence.demographics.medianHouseholdIncome && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Median Income</span>
                    <span>${intelligence.demographics.medianHouseholdIncome.toLocaleString()}</span>
                  </div>
                )}
                {intelligence.demographics.medianHomeValue && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Median Home Value</span>
                    <span>${intelligence.demographics.medianHomeValue.toLocaleString()}</span>
                  </div>
                )}
                {intelligence.demographics.unemploymentRate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unemployment</span>
                    <span>{intelligence.demographics.unemploymentRate.toFixed(1)}%</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Nearby Parks */}
          {intelligence?.nearbyParks && intelligence.nearbyParks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Nearby MH Parks
                </CardTitle>
                <CardDescription>Within 10 miles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {intelligence.nearbyParks.slice(0, 5).map((park) => (
                    <div key={park.id} className="text-sm">
                      <div className="font-medium">{park.name}</div>
                      <div className="text-muted-foreground">
                        {park.city} - {park.distanceMiles} mi
                        {park.lotCount && ` - ${park.lotCount} lots`}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* TDHCA Match */}
          {intelligence?.tdhcaMatch && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  TDHCA Record
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Label/HUD</span>
                  <span className="font-mono">{intelligence.tdhcaMatch.labelOrHud}</span>
                </div>
                {intelligence.tdhcaMatch.manufacturer && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Manufacturer</span>
                    <span>{intelligence.tdhcaMatch.manufacturer}</span>
                  </div>
                )}
                {intelligence.tdhcaMatch.yearMfg && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Year Mfg</span>
                    <span>{intelligence.tdhcaMatch.yearMfg}</span>
                  </div>
                )}
                {intelligence.tdhcaMatch.hasLien && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Has Tax Lien</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value?: string | null;
  capitalize?: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`font-medium ${capitalize ? 'capitalize' : ''}`}>{value || '-'}</p>
    </div>
  );
}

function UtilityStatus({
  label,
  hasCoverage,
  provider,
}: {
  label: string;
  hasCoverage?: boolean | null;
  provider?: string | null;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {hasCoverage ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground" />
        )}
        <span>{label}</span>
      </div>
      <span className="text-sm text-muted-foreground truncate max-w-[150px]">
        {hasCoverage ? provider || 'Available' : 'No coverage'}
      </span>
    </div>
  );
}
