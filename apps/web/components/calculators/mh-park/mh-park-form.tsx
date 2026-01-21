'use client';

import type { MhParkCalculatorInputs, MhParkCalculatorResults } from '@dealforge/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { calculateMhParkMetrics } from '@/lib/calculations/mh-park';
import { MH_PARK_DEFAULTS } from '@/lib/constants/mh-park-defaults';

import {
  ExpensesSection,
  FinancingSection,
  PropertyInfoSection,
  ValuationSection,
} from './mh-park-form-sections';
import { mhParkInputSchema } from './mh-park-schema';

interface MhParkFormProps {
  onResultsChange: (
    results: MhParkCalculatorResults | null,
    inputs: MhParkCalculatorInputs | null
  ) => void;
  initialValues?: Partial<MhParkCalculatorInputs>;
}

export function MhParkForm({ onResultsChange, initialValues }: MhParkFormProps) {
  const {
    register,
    watch,
    formState: { errors },
    getValues,
  } = useForm<MhParkCalculatorInputs>({
    resolver: zodResolver(mhParkInputSchema),
    defaultValues: {
      ...MH_PARK_DEFAULTS,
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
        const results = calculateMhParkMetrics(values);
        onResultsChangeRef.current(results, values);
      } catch (error) {
        console.error('Calculation error:', error);
        onResultsChangeRef.current(null, null);
      }
    });

    // Calculate initial results
    try {
      const initialValues = getValues();
      const results = calculateMhParkMetrics(initialValues);
      onResultsChangeRef.current(results, initialValues);
    } catch (error) {
      console.error('Initial calculation error:', error);
    }

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <PropertyInfoSection register={register} errors={errors} watch={watch} />
      <FinancingSection register={register} errors={errors} />
      <ExpensesSection register={register} errors={errors} />
      <ValuationSection register={register} errors={errors} />
    </div>
  );
}
