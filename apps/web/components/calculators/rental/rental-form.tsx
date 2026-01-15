'use client';

import type { RentalInputs, RentalResults } from '@dealforge/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { calculateRentalMetrics } from '@/lib/calculations/rental';
import { RENTAL_DEFAULTS } from '@/lib/constants/rental-defaults';

import {
  ExpensesSection,
  FinancingSection,
  IncomeSection,
  PurchaseSection,
} from './rental-form-sections';
import { rentalInputSchema } from './rental-schema';

interface RentalFormProps {
  onResultsChange: (results: RentalResults | null, inputs: RentalInputs | null) => void;
}

export function RentalForm({ onResultsChange }: RentalFormProps) {
  const {
    register,
    watch,
    formState: { errors },
    getValues,
  } = useForm<RentalInputs>({
    resolver: zodResolver(rentalInputSchema),
    defaultValues: RENTAL_DEFAULTS,
    mode: 'onChange',
  });

  // Store the callback in a ref to avoid dependency issues
  const onResultsChangeRef = useRef(onResultsChange);
  onResultsChangeRef.current = onResultsChange;

  // Calculate results whenever form values change
  useEffect(() => {
    // Subscribe to all form changes
    const subscription = watch(() => {
      // Get the complete values (watch callback may have partial data)
      const values = getValues();

      try {
        const results = calculateRentalMetrics(values);
        onResultsChangeRef.current(results, values);
      } catch (error) {
        console.error('Calculation error:', error);
        onResultsChangeRef.current(null, null);
      }
    });

    // Calculate initial results
    try {
      const initialValues = getValues();
      const results = calculateRentalMetrics(initialValues);
      onResultsChangeRef.current(results, initialValues);
    } catch (error) {
      console.error('Initial calculation error:', error);
    }

    return () => subscription.unsubscribe();
  }, [watch, getValues]);

  return (
    <div className="space-y-6">
      <PurchaseSection register={register} errors={errors} />
      <FinancingSection register={register} errors={errors} />
      <IncomeSection register={register} errors={errors} />
      <ExpensesSection register={register} errors={errors} />
    </div>
  );
}
