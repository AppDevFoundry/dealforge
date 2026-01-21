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
  PropertyInfoSection,
  UnitMixSection,
  VacancyLossSection,
  ValuationSection,
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
        const results = calculateMultifamilyMetrics(values);
        onResultsChangeRef.current(results, values);
      } catch (error) {
        console.error('Calculation error:', error);
        onResultsChangeRef.current(null, null);
      }
    });

    // Calculate initial results
    try {
      const initialValues = getValues();
      const results = calculateMultifamilyMetrics(initialValues);
      onResultsChangeRef.current(results, initialValues);
    } catch (error) {
      console.error('Initial calculation error:', error);
    }

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <PropertyInfoSection register={register} errors={errors} />
      <UnitMixSection register={register} errors={errors} watch={watch} />
      <OtherIncomeSection register={register} errors={errors} />
      <VacancyLossSection register={register} errors={errors} />
      <ExpensesSection register={register} errors={errors} watch={watch} setValue={setValue} />
      <FinancingSection register={register} errors={errors} />
      <ValuationSection register={register} errors={errors} />
    </div>
  );
}
