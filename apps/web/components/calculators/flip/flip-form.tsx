'use client';

import type { FlipInputs, FlipResults } from '@dealforge/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { calculateFlipMetrics } from '@/lib/calculations/flip';
import { FLIP_DEFAULTS } from '@/lib/constants/flip-defaults';

import {
  ArvSaleSection,
  FinancingSection,
  HoldingSection,
  PurchaseRehabSection,
} from './flip-form-sections';
import { flipInputSchema } from './flip-schema';

interface FlipFormProps {
  onResultsChange: (results: FlipResults | null, inputs: FlipInputs | null) => void;
  initialValues?: Partial<FlipInputs>;
}

export function FlipForm({ onResultsChange, initialValues }: FlipFormProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
    getValues,
  } = useForm<FlipInputs>({
    resolver: zodResolver(flipInputSchema),
    defaultValues: {
      ...FLIP_DEFAULTS,
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
        const results = calculateFlipMetrics(values);
        onResultsChangeRef.current(results, values);
      } catch (error) {
        console.error('Calculation error:', error);
        onResultsChangeRef.current(null, null);
      }
    });

    // Calculate initial results
    try {
      const initialValues = getValues();
      const results = calculateFlipMetrics(initialValues);
      onResultsChangeRef.current(results, initialValues);
    } catch (error) {
      console.error('Initial calculation error:', error);
    }

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <PurchaseRehabSection register={register} errors={errors} />
      <ArvSaleSection register={register} errors={errors} />
      <HoldingSection register={register} errors={errors} />
      <FinancingSection register={register} errors={errors} watch={watch} setValue={setValue} />
    </div>
  );
}
