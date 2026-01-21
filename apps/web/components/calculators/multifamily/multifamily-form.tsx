'use client';

import type { MultifamilyInputs, MultifamilyResults } from '@dealforge/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { calculateMultifamilyMetrics } from '@/lib/calculations/multifamily';
import { MULTIFAMILY_DEFAULTS } from '@/lib/constants/multifamily-defaults';

import {
  ExpensesSection,
  FinancingSection,
  OtherIncomeSection,
  PurchaseSection,
  UnitMixSection,
} from './multifamily-form-sections';
import { multifamilyInputSchema } from './multifamily-schema';

interface MultifamilyFormProps {
  onResultsChange: (results: MultifamilyResults | null, inputs: MultifamilyInputs | null) => void;
  initialValues?: Partial<MultifamilyInputs>;
}

export function MultifamilyForm({ onResultsChange, initialValues }: MultifamilyFormProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
    getValues,
  } = useForm<MultifamilyInputs>({
    resolver: zodResolver(multifamilyInputSchema),
    defaultValues: {
      ...MULTIFAMILY_DEFAULTS,
      ...initialValues,
    },
    mode: 'onChange',
  });

  const useExpenseRatio = watch('useExpenseRatio');

  // Store the callback in a ref to avoid dependency issues
  const onResultsChangeRef = useRef(onResultsChange);
  onResultsChangeRef.current = onResultsChange;

  // Calculate results whenever form values change
  // biome-ignore lint/correctness/useExhaustiveDependencies: watch/getValues are stable references from useForm
  useEffect(() => {
    const subscription = watch(() => {
      const values = getValues();

      try {
        const results = calculateMultifamilyMetrics(values);
        onResultsChangeRef.current(results, values);
      } catch (error) {
        console.error('Calculation error:', error);
        onResultsChangeRef.current(null, null);
      }
    });

    // Calculate initial results
    try {
      const initialVals = getValues();
      const results = calculateMultifamilyMetrics(initialVals);
      onResultsChangeRef.current(results, initialVals);
    } catch (error) {
      console.error('Initial calculation error:', error);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleExpenseRatioChange = (checked: boolean) => {
    setValue('useExpenseRatio', checked, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <PurchaseSection register={register} errors={errors} />
      <UnitMixSection register={register} errors={errors} />
      <OtherIncomeSection register={register} errors={errors} />
      <ExpensesSection
        register={register}
        errors={errors}
        useExpenseRatio={useExpenseRatio}
        onExpenseRatioChange={handleExpenseRatioChange}
      />
      <FinancingSection register={register} errors={errors} />
    </div>
  );
}
