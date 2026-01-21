'use client';

import type { Deal, FlipInputs, FlipResults } from '@dealforge/types';
import { Save } from 'lucide-react';
import { useCallback, useState } from 'react';

import { LearnModeToggle } from '@/components/calculators/rental/learn-mode-toggle';
import { SaveDealDialog } from '@/components/deals/save-deal-dialog';
import { Button } from '@/components/ui/button';

import { FlipForm } from './flip-form';
import { FlipResultsDisplay } from './flip-results';

interface FlipCalculatorProps {
  dealId?: string;
  initialDeal?: Deal;
  onDealSaved?: (dealId: string) => void;
}

export function FlipCalculator({ dealId, initialDeal, onDealSaved }: FlipCalculatorProps) {
  const [results, setResults] = useState<FlipResults | null>(null);
  const [inputs, setInputs] = useState<FlipInputs | null>(null);
  const [learnMode, setLearnMode] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleResultsChange = useCallback(
    (newResults: FlipResults | null, newInputs: FlipInputs | null) => {
      setResults(newResults);
      setInputs(newInputs);
    },
    []
  );

  const handleSaveSuccess = (savedDealId: string) => {
    onDealSaved?.(savedDealId);
  };

  // Extract initial values from deal if present
  const initialValues = initialDeal?.inputs as Partial<FlipInputs> | undefined;

  return (
    <div className="space-y-6">
      {/* Header with Learn Mode toggle and Save button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {initialDeal?.name || 'Flip/Rehab Calculator'}
          </h1>
          <p className="text-muted-foreground">
            ARV-based profit projections for fix-and-flip investments
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
          <FlipForm onResultsChange={handleResultsChange} initialValues={initialValues} />
        </div>

        {/* Results */}
        <div className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <FlipResultsDisplay results={results} inputs={inputs} learnMode={learnMode} />
        </div>
      </div>

      {/* Save Dialog */}
      {inputs && results && (
        <SaveDealDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          dealType="flip"
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
