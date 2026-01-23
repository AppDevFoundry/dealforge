'use client';

import type { LayerVisibility } from './layer-controls';

interface MapLegendProps {
  layers: LayerVisibility;
}

interface LegendItem {
  key: string;
  label: string;
  color: string;
  borderColor: string;
  visibilityKey: keyof LayerVisibility;
  subLabel?: string;
}

const legendItems: LegendItem[] = [
  {
    key: 'ccnWater',
    label: 'Water Service Area',
    color: 'bg-blue-500/30',
    borderColor: 'border-blue-500',
    visibilityKey: 'ccnWater',
  },
  {
    key: 'ccnSewer',
    label: 'Sewer Service Area',
    color: 'bg-purple-500/30',
    borderColor: 'border-purple-500',
    visibilityKey: 'ccnSewer',
  },
  {
    key: 'floodHigh',
    label: 'High Flood Risk',
    color: 'bg-red-500/40',
    borderColor: 'border-red-500',
    visibilityKey: 'floodZones',
    subLabel: 'A, AE, V zones',
  },
  {
    key: 'floodModerate',
    label: 'Moderate Flood Risk',
    color: 'bg-yellow-500/30',
    borderColor: 'border-yellow-500',
    visibilityKey: 'floodZones',
    subLabel: 'X shaded zones',
  },
  {
    key: 'floodLow',
    label: 'Low/Minimal Risk',
    color: 'bg-green-500/20',
    borderColor: 'border-green-500',
    visibilityKey: 'floodZones',
    subLabel: 'X, C zones',
  },
];

export function MapLegend({ layers }: MapLegendProps) {
  // Only show legend items for active layers
  const activeItems = legendItems.filter((item) => layers[item.visibilityKey]);

  if (activeItems.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-3 right-3 z-10">
      <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border p-3">
        <div className="text-xs font-medium mb-2 text-muted-foreground">Legend</div>
        <div className="space-y-2">
          {activeItems.map((item) => (
            <div key={item.key} className="flex items-center gap-2">
              <span className={`size-4 rounded-sm ${item.color} border ${item.borderColor}`} />
              <div className="flex flex-col">
                <span className="text-xs">{item.label}</span>
                {item.subLabel && (
                  <span className="text-[10px] text-muted-foreground">{item.subLabel}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
