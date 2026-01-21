'use client';

import type { MhPropertyType } from '@dealforge/types';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface ParkMapControlsProps {
  visibleTypes: Set<MhPropertyType>;
  onToggleType: (type: MhPropertyType) => void;
}

const TYPE_COLORS: Record<MhPropertyType, string> = {
  family: '#3b82f6',
  senior: '#22c55e',
  mixed: '#a855f7',
  unknown: '#6b7280',
};

const TYPE_LABELS: Record<MhPropertyType, string> = {
  family: 'Family',
  senior: 'Senior',
  mixed: 'Mixed',
  unknown: 'Other',
};

export function ParkMapControls({ visibleTypes, onToggleType }: ParkMapControlsProps) {
  return (
    <Card className="absolute top-4 left-4 z-10 shadow-md">
      <CardContent className="p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Property Type
        </p>
        {(Object.keys(TYPE_COLORS) as MhPropertyType[]).map((type) => (
          <label key={type} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={visibleTypes.has(type)}
              onChange={() => onToggleType(type)}
              className="rounded border-muted-foreground"
            />
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] }} />
            <Label className="text-xs cursor-pointer">{TYPE_LABELS[type]}</Label>
          </label>
        ))}
      </CardContent>
    </Card>
  );
}

export { TYPE_COLORS };
