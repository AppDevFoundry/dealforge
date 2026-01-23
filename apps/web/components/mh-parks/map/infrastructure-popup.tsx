'use client';

import { Badge } from '@/components/ui/badge';
import type { CcnArea, FloodRiskLevel, FloodZone } from '@dealforge/types';
import { AlertTriangle, Building2, Droplets } from 'lucide-react';

// ============================================================================
// CCN Popup
// ============================================================================

interface CcnPopupProps {
  ccnArea: CcnArea;
}

function getServiceTypeLabel(serviceType: string): string {
  switch (serviceType) {
    case 'water':
      return 'Water';
    case 'sewer':
      return 'Sewer';
    case 'both':
      return 'Water & Sewer';
    default:
      return serviceType;
  }
}

function getServiceTypeColor(serviceType: string): string {
  switch (serviceType) {
    case 'water':
      return 'bg-blue-500/20 text-blue-700 border-blue-500/50';
    case 'sewer':
      return 'bg-purple-500/20 text-purple-700 border-purple-500/50';
    case 'both':
      return 'bg-indigo-500/20 text-indigo-700 border-indigo-500/50';
    default:
      return 'bg-gray-500/20 text-gray-700 border-gray-500/50';
  }
}

export function CcnPopup({ ccnArea }: CcnPopupProps) {
  return (
    <div className="min-w-[200px] max-w-[280px] p-3 bg-card text-card-foreground">
      <div className="flex items-center gap-2 mb-2">
        <Droplets className="size-4 text-blue-500" />
        <h3 className="font-semibold text-sm">Utility Service Area</h3>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <span className="text-muted-foreground">Utility:</span>
          <p className="font-medium">{ccnArea.utilityName}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Service:</span>
          <Badge
            variant="outline"
            className={`text-xs ${getServiceTypeColor(ccnArea.serviceType)}`}
          >
            {getServiceTypeLabel(ccnArea.serviceType)}
          </Badge>
        </div>

        {ccnArea.ccnNumber && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="size-3 shrink-0" />
            <span>CCN #{ccnArea.ccnNumber}</span>
          </div>
        )}

        {ccnArea.county && <div className="text-muted-foreground">{ccnArea.county} County</div>}
      </div>
    </div>
  );
}

// ============================================================================
// Flood Zone Popup
// ============================================================================

interface FloodZonePopupProps {
  floodZone: FloodZone;
}

function getRiskLevelColor(riskLevel: FloodRiskLevel): string {
  switch (riskLevel) {
    case 'high':
      return 'bg-red-500/20 text-red-700 border-red-500/50';
    case 'moderate':
      return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50';
    case 'low':
      return 'bg-green-500/20 text-green-700 border-green-500/50';
    default:
      return 'bg-gray-500/20 text-gray-700 border-gray-500/50';
  }
}

function getRiskLevelLabel(riskLevel: FloodRiskLevel): string {
  switch (riskLevel) {
    case 'high':
      return 'High Risk';
    case 'moderate':
      return 'Moderate Risk';
    case 'low':
      return 'Low Risk';
    default:
      return 'Undetermined';
  }
}

export function FloodZonePopup({ floodZone }: FloodZonePopupProps) {
  const isHighRisk = floodZone.riskLevel === 'high';

  return (
    <div className="min-w-[200px] max-w-[280px] p-3 bg-card text-card-foreground">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className={`size-4 ${isHighRisk ? 'text-red-500' : 'text-yellow-500'}`} />
        <h3 className="font-semibold text-sm">Flood Zone</h3>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Zone:</span>
          <span className="font-mono font-medium">{floodZone.zoneCode}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Risk:</span>
          <Badge variant="outline" className={`text-xs ${getRiskLevelColor(floodZone.riskLevel)}`}>
            {getRiskLevelLabel(floodZone.riskLevel)}
          </Badge>
        </div>

        {floodZone.zoneDescription && (
          <div>
            <span className="text-muted-foreground">Description:</span>
            <p className="mt-0.5">{floodZone.zoneDescription}</p>
          </div>
        )}

        {floodZone.county && (
          <div className="text-muted-foreground pt-1">{floodZone.county} County</div>
        )}

        {isHighRisk && (
          <div className="pt-2 text-red-600 dark:text-red-400 font-medium">
            Special Flood Hazard Area (SFHA)
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Combined Infrastructure Popup
// ============================================================================

export type InfrastructurePopupData =
  | { type: 'ccn'; data: CcnArea }
  | { type: 'flood'; data: FloodZone };

interface InfrastructurePopupProps {
  popupData: InfrastructurePopupData;
}

export function InfrastructurePopup({ popupData }: InfrastructurePopupProps) {
  if (popupData.type === 'ccn') {
    return <CcnPopup ccnArea={popupData.data} />;
  }
  return <FloodZonePopup floodZone={popupData.data} />;
}
