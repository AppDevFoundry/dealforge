'use client';

import type { Deal, MhParkInputs, MhParkResults } from '@dealforge/types';
import { Save } from 'lucide-react';
import { useCallback, useState } from 'react';

import { LearnModeToggle } from '@/components/calculators/rental/learn-mode-toggle';
import { SaveDealDialog } from '@/components/deals/save-deal-dialog';
import { Button } from '@/components/ui/button';

import { MhParkForm } from './mh-park-form';
import { MhParkResultsDisplay } from './mh-park-results';
import { MhParkSensitivity } from './mh-park-sensitivity';

interface MhParkCalculatorProps {
  dealId?: string;
  initialDeal?: Deal;
  onDealSaved?: (dealId: string) => void;
}

export function MhParkCalculator({ dealId, initialDeal, onDealSaved }: MhParkCalculatorProps) {
  const [results, setResults] = useState<MhParkResults | null>(null);
  const [inputs, setInputs] = useState<MhParkInputs | null>(null);
  const [learnMode, setLearnMode] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [occupancyOverride, setOccupancyOverride] = useState(85);
  const [rentOverride, setRentOverride] = useState(350);

  const handleResultsChange = useCallback(
    (newResults: MhParkResults | null, newInputs: MhParkInputs | null) => {
      setResults(newResults);
      setInputs(newInputs);
      if (newInputs) {
        setOccupancyOverride(newInputs.occupancyRate);
        setRentOverride(newInputs.averageLotRent);
      }
    },
    []
  );

  const handleSaveSuccess = (savedDealId: string) => {
    onDealSaved?.(savedDealId);
  };

  const initialValues = initialDeal?.inputs as Partial<MhParkInputs> | undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{initialDeal?.name || 'MH Park Calculator'}</h1>
          <p className="text-muted-foreground">Manufactured housing park lot rent analysis</p>
        </div>
        <div className="flex items-center gap-2">
          {results && (
            <Button onClick={() => setShowSaveDialog(true)}>
              <Save className="mr-2 h-4 w-4" />
              {dealId ? 'Update Deal' : 'Save Deal'}
            </Button>
          )}
          <LearnModeToggle enabled={learnMode} onChange={setLearnMode} />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <MhParkForm onResultsChange={handleResultsChange} initialValues={initialValues} />
          {inputs && (
            <MhParkSensitivity
              inputs={inputs}
              occupancyOverride={occupancyOverride}
              rentOverride={rentOverride}
              onOccupancyChange={setOccupancyOverride}
              onRentChange={setRentOverride}
            />
          )}
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          <MhParkResultsDisplay results={results} inputs={inputs} learnMode={learnMode} />
        </div>
      </div>

      {/* Save Dialog */}
      {inputs && results && (
        <SaveDealDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          dealType="mh_park"
          inputs={inputs as unknown as Record<string, unknown>}
          results={results as unknown as Record<string, unknown>}
          existingDealId={dealId}
          defaultValues={{
            name: initialDeal?.name,
            address: initialDeal?.address || undefined,
          }}
          onSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
}
