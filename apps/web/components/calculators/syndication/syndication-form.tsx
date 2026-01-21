'use client';

import type { SyndicationInputs, SyndicationResults } from '@dealforge/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { calculateSyndicationMetrics } from '@/lib/calculations/syndication';
import { SYNDICATION_DEFAULTS } from '@/lib/constants/syndication-defaults';

import {
  DebtSection,
  EquityStructureSection,
  ExitAssumptionsSection,
  FeesSection,
  GrowthAssumptionsSection,
  ProjectCapitalizationSection,
  PropertyOperationsSection,
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
    setValue,
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
    // Subscribe to all form changes
    const subscription = watch(() => {
      // Get the complete values (watch callback may have partial data)
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
      const initialValues = getValues();
      const results = calculateSyndicationMetrics(initialValues);
      onResultsChangeRef.current(results, initialValues);
    } catch (error) {
      console.error('Initial calculation error:', error);
    }

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <ProjectCapitalizationSection register={register} errors={errors} />
      <EquityStructureSection register={register} errors={errors} watch={watch} />
      <DebtSection register={register} errors={errors} watch={watch} setValue={setValue} />
      <FeesSection register={register} errors={errors} />
      <WaterfallSection register={register} errors={errors} watch={watch} />
      <PropertyOperationsSection register={register} errors={errors} />
      <GrowthAssumptionsSection register={register} errors={errors} />
      <ExitAssumptionsSection register={register} errors={errors} />
    </div>
  );
}
