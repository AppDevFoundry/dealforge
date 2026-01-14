'use client';

import type { RentalInputs, RentalResults } from '@dealforge/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect } from 'react';
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
  onResultsChange: (results: RentalResults | null) => void;
}

export function RentalForm({ onResultsChange }: RentalFormProps) {
  const {
    register,
    watch,
    formState: { errors, isValid },
  } = useForm<RentalInputs>({
    resolver: zodResolver(rentalInputSchema),
    defaultValues: RENTAL_DEFAULTS,
    mode: 'onChange',
  });

  // Watch all form values for real-time calculation
  const formValues = watch();

  // Memoize the calculation to avoid unnecessary recalculations
  const calculateResults = useCallback((values: RentalInputs): RentalResults | null => {
    try {
      return calculateRentalMetrics(values);
    } catch (error) {
      console.error('Calculation error:', error);
      return null;
    }
  }, []);

  // Recalculate on every valid change
  useEffect(() => {
    if (isValid) {
      const results = calculateResults(formValues);
      onResultsChange(results);
    } else {
      onResultsChange(null);
    }
  }, [formValues, isValid, calculateResults, onResultsChange]);

  return (
    <div className="space-y-6">
      <PurchaseSection register={register} errors={errors} />
      <FinancingSection register={register} errors={errors} />
      <IncomeSection register={register} errors={errors} />
      <ExpensesSection register={register} errors={errors} />
    </div>
  );
}
