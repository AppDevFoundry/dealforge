'use client';

import { ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ToolResultDisplayProps {
  toolName: string;
  result: unknown;
}

export function ToolResultDisplay({ toolName, result }: ToolResultDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Format tool name for display
  const displayName = toolName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();

  // Try to render structured data
  const renderContent = () => {
    if (!result || typeof result !== 'object') {
      return <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>;
    }

    const data = result as Record<string, unknown>;

    // Handle park search results
    if ('parks' in data && Array.isArray(data.parks)) {
      return renderParksTable(data.parks as Record<string, unknown>[]);
    }

    // Handle park details
    if ('park' in data && typeof data.park === 'object') {
      return renderParkDetails(data);
    }

    // Handle deal analysis
    if ('results' in data && 'assessment' in data) {
      return renderDealAnalysis(data);
    }

    // Handle county comparison
    if ('counties' in data && Array.isArray(data.counties)) {
      return renderCountyComparison(data);
    }

    // Handle market overview
    if ('summary' in data && 'distressMetrics' in data) {
      return renderMarketOverview(data);
    }

    // Fallback to JSON
    return <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>;
  };

  return (
    <Card className="my-2 bg-muted/50">
      <CardHeader
        className="py-2 px-3 cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">{displayName}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Tool Result
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      {isExpanded && <CardContent className="pt-0">{renderContent()}</CardContent>}
    </Card>
  );
}

function renderParksTable(parks: Record<string, unknown>[]) {
  if (parks.length === 0) {
    return <p className="text-sm text-muted-foreground">No parks found</p>;
  }

  return (
    <div className="overflow-auto max-h-[400px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>City</TableHead>
            <TableHead>County</TableHead>
            <TableHead className="text-right">Lots</TableHead>
            <TableHead className="text-right">Distress</TableHead>
            <TableHead className="text-right">Tax Owed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parks.slice(0, 10).map((park, idx) => (
            <TableRow key={(park.communityId as string) || idx}>
              <TableCell className="font-medium">{park.name as string}</TableCell>
              <TableCell>{park.city as string}</TableCell>
              <TableCell>{park.county as string}</TableCell>
              <TableCell className="text-right">{(park.lotCount as number) ?? '-'}</TableCell>
              <TableCell className="text-right">
                <Badge
                  variant={
                    (park.distressScore as number) >= 60
                      ? 'destructive'
                      : (park.distressScore as number) >= 30
                        ? 'default'
                        : 'secondary'
                  }
                >
                  {park.distressScore as number}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                ${((park.totalTaxOwed as number) || 0).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {parks.length > 10 && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Showing 10 of {parks.length} parks
        </p>
      )}
    </div>
  );
}

function renderParkDetails(data: Record<string, unknown>) {
  const park = data.park as Record<string, unknown>;
  const lienSummary = data.lienSummary as Record<string, unknown>;
  const distressIndicators = data.distressIndicators as Record<string, unknown>;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-sm">{park.name as string}</h4>
        <p className="text-sm text-muted-foreground">
          {park.address as string}, {park.city as string}, {park.county as string} County
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Lots</p>
          <p className="font-medium">{(park.lotCount as number) ?? 'Unknown'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Distress Score</p>
          <p className="font-medium">{(park.distressScore as number) ?? 'N/A'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Active Liens</p>
          <p className="font-medium">{(lienSummary?.activeLiens as number) ?? 0}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Total Tax Owed</p>
          <p className="font-medium">
            ${((lienSummary?.activeTaxAmount as number) || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {distressIndicators && (
        <div className="pt-2 border-t">
          <Badge
            variant={
              distressIndicators.riskLevel === 'high'
                ? 'destructive'
                : distressIndicators.riskLevel === 'medium'
                  ? 'default'
                  : 'secondary'
            }
          >
            {(distressIndicators.riskLevel as string)?.toUpperCase()} RISK
          </Badge>
        </div>
      )}
    </div>
  );
}

function renderDealAnalysis(data: Record<string, unknown>) {
  const results = data.results as Record<string, unknown>;
  const assessment = data.assessment as Record<string, unknown>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Cap Rate</p>
          <p className="font-semibold text-lg">{(results.capRate as number)?.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">Cash-on-Cash</p>
          <p className="font-semibold text-lg">
            {(results.cashOnCashReturn as number)?.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">DSCR</p>
          <p className="font-semibold text-lg">
            {(results.debtServiceCoverageRatio as number)?.toFixed(2)}x
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">NOI</p>
          <p className="font-medium">
            ${((results.netOperatingIncome as number) || 0).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Annual Cash Flow</p>
          <p className="font-medium">
            ${((results.annualCashFlow as number) || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {assessment && (
        <div className="pt-2 border-t flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rating:</span>
          <Badge
            variant={
              (assessment.overallRating as string)?.includes('buy')
                ? 'default'
                : (assessment.overallRating as string) === 'hold'
                  ? 'secondary'
                  : 'destructive'
            }
          >
            {(assessment.overallRating as string)?.toUpperCase().replace('_', ' ')}
          </Badge>
        </div>
      )}
    </div>
  );
}

function renderCountyComparison(data: Record<string, unknown>) {
  const counties = data.counties as Record<string, unknown>[];
  const insights = data.insights as string[];

  return (
    <div className="space-y-4">
      <div className="overflow-auto max-h-[300px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>County</TableHead>
              <TableHead className="text-right">Parks</TableHead>
              <TableHead className="text-right">Avg Distress</TableHead>
              <TableHead className="text-right">Tax Owed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {counties.map((county, idx) => (
              <TableRow key={(county.county as string) || idx}>
                <TableCell className="font-medium">{county.county as string}</TableCell>
                <TableCell className="text-right">{county.parkCount as number}</TableCell>
                <TableCell className="text-right">{county.avgDistressScore as number}</TableCell>
                <TableCell className="text-right">
                  ${((county.totalTaxOwed as number) || 0).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {insights && insights.length > 0 && (
        <div className="text-sm space-y-1">
          {insights.map((insight, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Insights may not be unique
            <p key={idx} className="text-muted-foreground">
              • {insight}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function renderMarketOverview(data: Record<string, unknown>) {
  const summary = data.summary as Record<string, unknown>;
  const distressMetrics = data.distressMetrics as Record<string, unknown>;
  const insights = data.insights as string[];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Total Parks</p>
          <p className="font-semibold text-lg">{summary.totalParks as number}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Total Lots</p>
          <p className="font-semibold text-lg">
            {((summary.totalLots as number) || 0).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Avg Distress</p>
          <p className="font-semibold text-lg">{distressMetrics.avgDistressScore as number}</p>
        </div>
      </div>

      {insights && insights.length > 0 && (
        <div className="text-sm space-y-1 pt-2 border-t">
          {insights.map((insight, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Insights may not be unique
            <p key={idx} className="text-muted-foreground">
              • {insight}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
