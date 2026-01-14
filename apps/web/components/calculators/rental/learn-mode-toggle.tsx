'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface LearnModeToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function LearnModeToggle({ enabled, onChange }: LearnModeToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <Switch id="learn-mode" checked={enabled} onCheckedChange={onChange} />
      <Label htmlFor="learn-mode" className="cursor-pointer text-sm font-medium">
        Learn Mode
      </Label>
    </div>
  );
}
