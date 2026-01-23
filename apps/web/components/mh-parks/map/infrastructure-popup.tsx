'use client';

import type { CcnAreaProperties, FloodZoneProperties } from '@dealforge/types';
import { Droplets, ShieldAlert, Waves } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

export type InfrastructurePopupData =
  | { type: 'ccn'; properties: CcnAreaProperties }
  | { type: 'flood'; properties: FloodZoneProperties };

interface InfrastructurePopupProps {
  data: InfrastructurePopupData;
}

function getRiskBadgeVariant(riskLevel: string): 'destructive' | 'secondary' | 'outline' {
  if (riskLevel === 'high') return 'destructive';
  if (riskLevel === 'moderate') return 'secondary';
  return 'outline';
}

function getServiceTypeIcon(serviceType: string) {
  if (serviceType === 'water' || serviceType === 'both') return Droplets;
  return Waves;
}

export function InfrastructurePopup({ data }: InfrastructurePopupProps) {
  if (data.type === 'ccn') {
    const { properties } = data;
    const Icon = getServiceTypeIcon(properties.serviceType);

    return (
      <div className="min-w-[200px] max-w-[280px] p-3 bg-card text-card-foreground">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="size-4 text-blue-500" />
          <h3 className="font-semibold text-sm">CCN Service Area</h3>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Utility:</span>
            <span className="font-medium text-right ml-2">{properties.utilityName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Service:</span>
            <Badge variant="secondary" className="text-xs capitalize">
              {properties.serviceType}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">CCN #:</span>
            <span>{properties.ccnNumber}</span>
          </div>
        </div>
      </div>
    );
  }

  const { properties } = data;

  return (
    <div className="min-w-[200px] max-w-[280px] p-3 bg-card text-card-foreground">
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className="size-4 text-red-500" />
        <h3 className="font-semibold text-sm">Flood Zone</h3>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Zone:</span>
          <span className="font-medium">{properties.zoneCode}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Risk Level:</span>
          <Badge variant={getRiskBadgeVariant(properties.riskLevel)} className="text-xs capitalize">
            {properties.riskLevel}
          </Badge>
        </div>
        {properties.zoneDescription && (
          <div className="pt-1">
            <span className="text-muted-foreground">{properties.zoneDescription}</span>
          </div>
        )}
        {properties.riskLevel === 'high' && (
          <p className="text-muted-foreground pt-1 italic">
            Flood insurance required for federally backed mortgages
          </p>
        )}
      </div>
    </div>
  );
}
