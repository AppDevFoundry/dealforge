'use client';

import type { SyndicationInputs, SyndicationResults } from '@dealforge/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { calculateSyndicationMetrics } from '@/lib/calculations/syndication';
import { SYNDICATION_DEFAULTS } from '@/lib/constants/syndication-defaults';

import {
  CapitalStructureSection,
  ExitSection,
  FeesSection,
  OperationsSection,
  WaterfallSection,
} from './syndication-form-sections';
import { syndicationInputSchema } from './syndication-schema';

interface SyndicationFormProps {
  onResultsChange: (results: SyndicationResults | null, inputs: SyndicationInputs | null) => void;
  initialValues?: Partial<SyndicationInputs>;
}

export function SyndicationForm({ onResultsChange, initialValues }: SyndicationFormProps) {
  const {
    register,
    watch,
    formState: { errors },
    getValues,
  } = useForm<SyndicationInputs>({
    resolver: zodResolver(syndicationInputSchema),
    defaultValues: {
      ...SYNDICATION_DEFAULTS,
      ...initialValues,
    },
    mode: 'onChange',
  });

  // Store the callback in a ref to avoid dependency issues
  const onResultsChangeRef = useRef(onResultsChange);
  onResultsChangeRef.current = onResultsChange;

  // Calculate results whenever form values change
  // biome-ignore lint/correctness/useExhaustiveDependencies: watch/getValues are stable references from useForm
  useEffect(() => {
    const subscription = watch(() => {
      const values = getValues();

      try {
        const results = calculateSyndicationMetrics(values);
        onResultsChangeRef.current(results, values);
      } catch (error) {
        console.error('Calculation error:', error);
        onResultsChangeRef.current(null, null);
      }
    });

    // Calculate initial results
    try {
      const initialVals = getValues();
      const results = calculateSyndicationMetrics(initialVals);
      onResultsChangeRef.current(results, initialVals);
    } catch (error) {
      console.error('Initial calculation error:', error);
    }

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <CapitalStructureSection register={register} errors={errors} />
      <FeesSection register={register} errors={errors} />
      <WaterfallSection register={register} errors={errors} />
      <OperationsSection register={register} errors={errors} />
      <ExitSection register={register} errors={errors} />
    </div>
  );
}
