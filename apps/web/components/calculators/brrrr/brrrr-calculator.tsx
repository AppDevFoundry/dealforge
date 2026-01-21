'use client';

import type { BRRRRInputs, BRRRRResults, Deal } from '@dealforge/types';
import { Save } from 'lucide-react';
import { useCallback, useState } from 'react';

import { LearnModeToggle } from '@/components/calculators/rental/learn-mode-toggle';
import { SaveDealDialog } from '@/components/deals/save-deal-dialog';
import { Button } from '@/components/ui/button';

import { BRRRRForm } from './brrrr-form';
import { BRRRRResultsDisplay } from './brrrr-results';

interface BRRRRCalculatorProps {
  dealId?: string;
  initialDeal?: Deal;
  onDealSaved?: (dealId: string) => void;
}

export function BRRRRCalculator({ dealId, initialDeal, onDealSaved }: BRRRRCalculatorProps) {
  const [results, setResults] = useState<BRRRRResults | null>(null);
  const [inputs, setInputs] = useState<BRRRRInputs | null>(null);
  const [learnMode, setLearnMode] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleResultsChange = useCallback(
    (newResults: BRRRRResults | null, newInputs: BRRRRInputs | null) => {
      setResults(newResults);
      setInputs(newInputs);
    },
    []
  );

  const handleSaveSuccess = (savedDealId: string) => {
    onDealSaved?.(savedDealId);
  };

  const initialValues = initialDeal?.inputs as Partial<BRRRRInputs> | undefined;

  return (
    <div className="space-y-6">
      {/* Header with Learn Mode toggle and Save button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {initialDeal?.name || 'BRRRR Calculator'}
          </h1>
          <p className="text-muted-foreground">
            Buy-Rehab-Rent-Refinance-Repeat analysis with refinance projections
          </p>
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

      {/* Two-column layout on large screens */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form */}
        <div>
          <BRRRRForm onResultsChange={handleResultsChange} initialValues={initialValues} />
        </div>

        {/* Results */}
        <div className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <BRRRRResultsDisplay results={results} inputs={inputs} learnMode={learnMode} />
        </div>
      </div>

      {/* Save Dialog */}
      {inputs && results && (
        <SaveDealDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          dealType="brrrr"
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
