'use client';

import type { InfrastructureLayerVisibility } from '@dealforge/types';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface LayerControlsProps {
  visibility: InfrastructureLayerVisibility;
  onVisibilityChange: (visibility: InfrastructureLayerVisibility) => void;
}

const LAYER_CONFIG = [
  { key: 'communities' as const, label: 'Communities', color: '#3b82f6' },
  { key: 'waterCcn' as const, label: 'Water CCN', color: '#3b82f6' },
  { key: 'sewerCcn' as const, label: 'Sewer CCN', color: '#8b5cf6' },
  { key: 'floodZonesHigh' as const, label: 'Flood (High Risk)', color: '#ef4444' },
  { key: 'floodZonesModerate' as const, label: 'Flood (Moderate)', color: '#fbbf24' },
];

export function LayerControls({ visibility, onVisibilityChange }: LayerControlsProps) {
  const handleToggle = (key: keyof InfrastructureLayerVisibility) => {
    onVisibilityChange({ ...visibility, [key]: !visibility[key] });
  };

  return (
    <div className="absolute top-4 right-14 z-10 rounded-lg bg-background/90 backdrop-blur border shadow-sm p-3 space-y-2 min-w-[170px]">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Layers
      </p>
      {LAYER_CONFIG.map(({ key, label, color }) => (
        <div key={key} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm border"
              style={{ backgroundColor: color, opacity: 0.6 }}
            />
            <Label htmlFor={`layer-${key}`} className="text-xs cursor-pointer">
              {label}
            </Label>
          </div>
          <Switch
            id={`layer-${key}`}
            checked={visibility[key]}
            onCheckedChange={() => handleToggle(key)}
            className="scale-75"
          />
        </div>
      ))}
    </div>
  );
}
