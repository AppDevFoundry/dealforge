'use client';

import type { FlipInputs, FlipResults } from '@dealforge/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { calculateFlipMetrics } from '@/lib/calculations/flip';
import { FLIP_DEFAULTS } from '@/lib/constants/flip-defaults';

import {
  FinancingSection,
  PurchaseSection,
  RehabHoldingSection,
  SellingCostsSection,
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

  const useLoan = watch('useLoan');

  // Store the callback in a ref to avoid dependency issues
  const onResultsChangeRef = useRef(onResultsChange);
  onResultsChangeRef.current = onResultsChange;

  // Calculate results whenever form values change
  // biome-ignore lint/correctness/useExhaustiveDependencies: watch/getValues are stable references from useForm
  useEffect(() => {
    const subscription = watch(() => {
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
      const initialVals = getValues();
      const results = calculateFlipMetrics(initialVals);
      onResultsChangeRef.current(results, initialVals);
    } catch (error) {
      console.error('Initial calculation error:', error);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleUseLoanChange = (checked: boolean) => {
    setValue('useLoan', checked, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <PurchaseSection register={register} errors={errors} />
      <RehabHoldingSection register={register} errors={errors} />
      <FinancingSection
        register={register}
        errors={errors}
        useLoan={useLoan}
        onUseLoanChange={handleUseLoanChange}
      />
      <SellingCostsSection register={register} errors={errors} />
    </div>
  );
}
