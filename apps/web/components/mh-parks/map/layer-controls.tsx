'use client';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ChevronDown, Layers } from 'lucide-react';
import { useState } from 'react';

export interface LayerVisibility {
  communities: boolean;
  ccnWater: boolean;
  ccnSewer: boolean;
  facilityWater: boolean;
  facilitySewer: boolean;
  floodZones: boolean;
}

interface LayerControlsProps {
  layers: LayerVisibility;
  onLayersChange: (layers: LayerVisibility) => void;
  isLoading?: boolean;
}

export function LayerControls({ layers, onLayersChange, isLoading }: LayerControlsProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleToggle = (key: keyof LayerVisibility) => {
    onLayersChange({
      ...layers,
      [key]: !layers[key],
    });
  };

  return (
    <div className="absolute top-3 left-3 z-10">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border min-w-[180px]">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-muted/50 rounded-t-lg transition-colors">
            <div className="flex items-center gap-2">
              <Layers className="size-4" />
              <span className="font-medium text-sm">Layers</span>
              {isLoading && <span className="size-2 rounded-full bg-primary animate-pulse" />}
            </div>
            <ChevronDown className={`size-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-3 pb-3 space-y-3">
              {/* Communities layer */}
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="layer-communities" className="text-xs font-normal cursor-pointer">
                  Communities
                </Label>
                <Switch
                  id="layer-communities"
                  checked={layers.communities}
                  onCheckedChange={() => handleToggle('communities')}
                  className="scale-90"
                />
              </div>

              {/* CCN Water layer */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-sm bg-blue-500/30 border border-blue-500" />
                  <Label htmlFor="layer-ccn-water" className="text-xs font-normal cursor-pointer">
                    CCN Water
                  </Label>
                </div>
                <Switch
                  id="layer-ccn-water"
                  checked={layers.ccnWater}
                  onCheckedChange={() => handleToggle('ccnWater')}
                  className="scale-90"
                />
              </div>

              {/* CCN Sewer layer */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-sm bg-purple-500/30 border border-purple-500" />
                  <Label htmlFor="layer-ccn-sewer" className="text-xs font-normal cursor-pointer">
                    CCN Sewer
                  </Label>
                </div>
                <Switch
                  id="layer-ccn-sewer"
                  checked={layers.ccnSewer}
                  onCheckedChange={() => handleToggle('ccnSewer')}
                  className="scale-90"
                />
              </div>

              {/* Facility Water layer (lines) */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-0.5 w-3 bg-cyan-500" />
                  <Label
                    htmlFor="layer-facility-water"
                    className="text-xs font-normal cursor-pointer"
                  >
                    Water Lines
                  </Label>
                </div>
                <Switch
                  id="layer-facility-water"
                  checked={layers.facilityWater}
                  onCheckedChange={() => handleToggle('facilityWater')}
                  className="scale-90"
                />
              </div>

              {/* Facility Sewer layer (lines) */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-0.5 w-3 bg-fuchsia-500" />
                  <Label
                    htmlFor="layer-facility-sewer"
                    className="text-xs font-normal cursor-pointer"
                  >
                    Sewer Lines
                  </Label>
                </div>
                <Switch
                  id="layer-facility-sewer"
                  checked={layers.facilitySewer}
                  onCheckedChange={() => handleToggle('facilitySewer')}
                  className="scale-90"
                />
              </div>

              {/* Flood Zones layer */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-sm bg-red-500/40 border border-red-500" />
                  <Label htmlFor="layer-flood-zones" className="text-xs font-normal cursor-pointer">
                    Flood Zones
                  </Label>
                </div>
                <Switch
                  id="layer-flood-zones"
                  checked={layers.floodZones}
                  onCheckedChange={() => handleToggle('floodZones')}
                  className="scale-90"
                />
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
