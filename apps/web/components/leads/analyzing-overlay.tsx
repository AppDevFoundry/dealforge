'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LeadIntelligence } from '@dealforge/types';
import { Brain, Building, Check, Droplets, Loader2, MapPin } from 'lucide-react';
import { useMemo } from 'react';

interface AnalyzingOverlayProps {
  intelligence?: LeadIntelligence | null;
  className?: string;
}

interface ProgressStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  isComplete: boolean;
}

/**
 * Determines which analysis steps are complete based on intelligence data
 * Note: Geocoding completion is indicated by any utility/location data being present,
 * since coordinates are stored on the lead, not the intelligence object
 */
function getProgressSteps(intelligence?: LeadIntelligence | null): ProgressStep[] {
  // Geocoding is complete if we have any location-based data (CCN, flood zone, etc.)
  const hasLocationData =
    intelligence?.hasWaterCoverage !== null ||
    intelligence?.hasSewerCoverage !== null ||
    intelligence?.floodZone !== null;

  return [
    {
      id: 'geocoding',
      label: 'Geocoding address',
      icon: <MapPin className="h-4 w-4" />,
      isComplete: hasLocationData,
    },
    {
      id: 'utilities',
      label: 'Checking utility coverage',
      icon: <Droplets className="h-4 w-4" />,
      isComplete:
        intelligence?.hasWaterCoverage !== null || intelligence?.hasSewerCoverage !== null,
    },
    {
      id: 'market',
      label: 'Fetching market data',
      icon: <Building className="h-4 w-4" />,
      isComplete: !!(intelligence?.fmrData || intelligence?.demographics),
    },
    {
      id: 'ai',
      label: 'Running AI analysis',
      icon: <Brain className="h-4 w-4" />,
      isComplete: !!intelligence?.aiAnalysis,
    },
  ];
}

export function AnalyzingOverlay({ intelligence, className }: AnalyzingOverlayProps) {
  const steps = useMemo(() => getProgressSteps(intelligence), [intelligence]);
  const completedCount = steps.filter((s) => s.isComplete).length;
  const progressPercent = (completedCount / steps.length) * 100;

  return (
    <Card className={cn('border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="relative">
            <Loader2 className="h-6 w-6 animate-spin text-yellow-600" />
          </div>
          Analyzing your lead...
        </CardTitle>
        <CardDescription>
          We're gathering intelligence on this property. This usually takes 30-60 seconds.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-yellow-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Progress steps */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {steps.map((step, index) => {
            // Determine if this step is currently active (first incomplete step)
            const isActive = !step.isComplete && steps.slice(0, index).every((s) => s.isComplete);

            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-2 text-sm rounded-lg p-2 transition-colors',
                  step.isComplete &&
                    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
                  isActive &&
                    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
                  !step.isComplete && !isActive && 'text-muted-foreground'
                )}
              >
                <div className="flex-shrink-0">
                  {step.isComplete ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span className={cn('truncate', step.isComplete && 'line-through opacity-70')}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
