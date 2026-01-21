'use client';

import { Layers, ZoomIn, ZoomOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MapControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  mapStyle?: string;
  onMapStyleChange?: (style: string) => void;
}

const MAP_STYLES = [
  { id: 'mapbox://styles/mapbox/light-v11', label: 'Light' },
  { id: 'mapbox://styles/mapbox/dark-v11', label: 'Dark' },
  { id: 'mapbox://styles/mapbox/streets-v12', label: 'Streets' },
  { id: 'mapbox://styles/mapbox/satellite-streets-v12', label: 'Satellite' },
];

export function MapControls({
  onZoomIn,
  onZoomOut,
  mapStyle,
  onMapStyleChange,
}: MapControlsProps) {
  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
      <div className="flex flex-col gap-1 rounded-md bg-background/90 backdrop-blur border shadow-sm">
        <Button variant="ghost" size="icon" onClick={onZoomIn} className="h-8 w-8">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onZoomOut} className="h-8 w-8">
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md bg-background/90 backdrop-blur border shadow-sm"
          >
            <Layers className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {MAP_STYLES.map((style) => (
            <DropdownMenuItem
              key={style.id}
              onClick={() => onMapStyleChange?.(style.id)}
              className={mapStyle === style.id ? 'bg-accent' : ''}
            >
              {style.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
