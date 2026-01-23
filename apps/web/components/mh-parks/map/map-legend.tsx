'use client';

import type { InfrastructureLayerVisibility } from '@dealforge/types';

interface MapLegendProps {
  visibility: InfrastructureLayerVisibility;
}

const LEGEND_ITEMS = [
  { key: 'communities' as const, label: 'MH Communities', color: '#3b82f6', type: 'marker' },
  { key: 'waterCcn' as const, label: 'Water CCN', color: '#3b82f6', type: 'fill' },
  { key: 'sewerCcn' as const, label: 'Sewer CCN', color: '#8b5cf6', type: 'fill' },
  { key: 'floodZonesHigh' as const, label: 'Flood - High Risk', color: '#ef4444', type: 'fill' },
  { key: 'floodZonesModerate' as const, label: 'Flood - Moderate', color: '#fbbf24', type: 'fill' },
];

export function MapLegend({ visibility }: MapLegendProps) {
  const activeItems = LEGEND_ITEMS.filter((item) => visibility[item.key]);

  if (activeItems.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 z-10 rounded-lg bg-background/90 backdrop-blur border shadow-sm p-2">
      <div className="space-y-1">
        {activeItems.map(({ key, label, color, type }) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            {type === 'marker' ? (
              <svg width="12" height="12" viewBox="0 0 12 12" role="img" aria-label={label}>
                <circle cx="6" cy="6" r="5" fill={color} />
              </svg>
            ) : (
              <span
                className="inline-block h-3 w-4 rounded-sm border"
                style={{ backgroundColor: color, opacity: 0.5 }}
              />
            )}
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
