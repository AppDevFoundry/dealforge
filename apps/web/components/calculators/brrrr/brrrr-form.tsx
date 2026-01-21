'use client';

import type { BRRRRInputs, BRRRRResults } from '@dealforge/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { calculateBRRRRMetrics } from '@/lib/calculations/brrrr';
import { BRRRR_DEFAULTS } from '@/lib/constants/brrrr-defaults';

import {
  ExpensesSection,
  IncomeSection,
  InitialFinancingSection,
  PurchaseSection,
  RefinanceSection,
  RehabSection,
} from './brrrr-form-sections';
import { brrrrInputSchema } from './brrrr-schema';

interface BRRRRFormProps {
  onResultsChange: (results: BRRRRResults | null, inputs: BRRRRInputs | null) => void;
  initialValues?: Partial<BRRRRInputs>;
}

export function BRRRRForm({ onResultsChange, initialValues }: BRRRRFormProps) {
  const {
    register,
    watch,
    formState: { errors },
    getValues,
  } = useForm<BRRRRInputs>({
    resolver: zodResolver(brrrrInputSchema),
    defaultValues: {
      ...BRRRR_DEFAULTS,
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
        const results = calculateBRRRRMetrics(values);
        onResultsChangeRef.current(results, values);
      } catch (error) {
        console.error('Calculation error:', error);
        onResultsChangeRef.current(null, null);
      }
    });

    // Calculate initial results
    try {
      const initialVals = getValues();
      const results = calculateBRRRRMetrics(initialVals);
      onResultsChangeRef.current(results, initialVals);
    } catch (error) {
      console.error('Initial calculation error:', error);
    }

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <PurchaseSection register={register} errors={errors} />
      <RehabSection register={register} errors={errors} />
      <InitialFinancingSection register={register} errors={errors} />
      <RefinanceSection register={register} errors={errors} />
      <IncomeSection register={register} errors={errors} />
      <ExpensesSection register={register} errors={errors} />
    </div>
  );
}
