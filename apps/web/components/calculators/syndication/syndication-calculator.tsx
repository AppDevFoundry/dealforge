'use client';

import type { Deal, SyndicationInputs, SyndicationResults } from '@dealforge/types';
import { Save } from 'lucide-react';
import { useCallback, useState } from 'react';

import { SaveDealDialog } from '@/components/deals/save-deal-dialog';
import { Button } from '@/components/ui/button';

import { LearnModeToggle } from '../rental/learn-mode-toggle';
import { SyndicationForm } from './syndication-form';
import { SyndicationResultsDisplay } from './syndication-results';

interface SyndicationCalculatorProps {
  dealId?: string;
  initialDeal?: Deal;
  onDealSaved?: (dealId: string) => void;
}

export function SyndicationCalculator({
  dealId,
  initialDeal,
  onDealSaved,
}: SyndicationCalculatorProps) {
  const [results, setResults] = useState<SyndicationResults | null>(null);
  const [inputs, setInputs] = useState<SyndicationInputs | null>(null);
  const [learnMode, setLearnMode] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleResultsChange = useCallback(
    (newResults: SyndicationResults | null, newInputs: SyndicationInputs | null) => {
      setResults(newResults);
      setInputs(newInputs);
    },
    []
  );

  const handleSaveSuccess = (savedDealId: string) => {
    onDealSaved?.(savedDealId);
  };

  // Extract initial values from deal if present
  const initialValues = initialDeal?.inputs as Partial<SyndicationInputs> | undefined;

  return (
    <div className="space-y-6">
      {/* Header with Learn Mode toggle and Save button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {initialDeal?.name || 'Syndication Calculator'}
          </h1>
          <p className="text-muted-foreground">
            Model waterfall distributions, LP/GP returns, IRR, and equity multiples
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
          <SyndicationForm onResultsChange={handleResultsChange} initialValues={initialValues} />
        </div>

        {/* Results */}
        <div className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <SyndicationResultsDisplay results={results} inputs={inputs} learnMode={learnMode} />
        </div>
      </div>

      {/* Save Dialog */}
      {inputs && results && (
        <SaveDealDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          dealType="syndication"
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
