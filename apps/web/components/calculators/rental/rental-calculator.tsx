'use client';

import type { RentalInputs, RentalResults } from '@dealforge/types';
import { useCallback, useState } from 'react';

import { LearnModeToggle } from './learn-mode-toggle';
import { RentalForm } from './rental-form';
import { RentalResultsDisplay } from './rental-results';

export function RentalCalculator() {
  const [results, setResults] = useState<RentalResults | null>(null);
  const [inputs, setInputs] = useState<RentalInputs | null>(null);
  const [learnMode, setLearnMode] = useState(false);

  const handleResultsChange = useCallback(
    (newResults: RentalResults | null, newInputs: RentalInputs | null) => {
      setResults(newResults);
      setInputs(newInputs);
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* Header with Learn Mode toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rental Property Calculator</h1>
          <p className="text-muted-foreground">
            Analyze cash flow, ROI, and key metrics for buy-and-hold rentals
          </p>
        </div>
        <LearnModeToggle enabled={learnMode} onChange={setLearnMode} />
      </div>

      {/* Two-column layout on large screens */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Form */}
        <div>
          <RentalForm onResultsChange={handleResultsChange} />
        </div>

        {/* Results */}
        <div className="lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <RentalResultsDisplay results={results} inputs={inputs} learnMode={learnMode} />
        </div>
      </div>
    </div>
  );
}
