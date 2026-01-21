'use client';

import type { HouseHackInputs, HouseHackResults } from '@dealforge/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { calculateHouseHackMetrics } from '@/lib/calculations/house-hack';
import { HOUSE_HACK_DEFAULTS } from '@/lib/constants/house-hack-defaults';

import {
  ExpensesSection,
  FinancingSection,
  PurchaseSection,
  UnitConfigSection,
} from './house-hack-form-sections';
import { houseHackInputSchema } from './house-hack-schema';

interface HouseHackFormProps {
  onResultsChange: (results: HouseHackResults | null, inputs: HouseHackInputs | null) => void;
  initialValues?: Partial<HouseHackInputs>;
}

export function HouseHackForm({ onResultsChange, initialValues }: HouseHackFormProps) {
  const {
    register,
    watch,
    formState: { errors },
    getValues,
  } = useForm<HouseHackInputs>({
    resolver: zodResolver(houseHackInputSchema),
    defaultValues: {
      ...HOUSE_HACK_DEFAULTS,
      ...initialValues,
    },
    mode: 'onChange',
  });

  const numberOfUnits = watch('numberOfUnits');
  const ownerUnit = watch('ownerUnit');

  // Store the callback in a ref to avoid dependency issues
  const onResultsChangeRef = useRef(onResultsChange);
  onResultsChangeRef.current = onResultsChange;

  // Calculate results whenever form values change
  // biome-ignore lint/correctness/useExhaustiveDependencies: watch/getValues are stable references from useForm
  useEffect(() => {
    const subscription = watch(() => {
      const values = getValues();

      try {
        const results = calculateHouseHackMetrics(values);
        onResultsChangeRef.current(results, values);
      } catch (error) {
        console.error('Calculation error:', error);
        onResultsChangeRef.current(null, null);
      }
    });

    // Calculate initial results
    try {
      const initialVals = getValues();
      const results = calculateHouseHackMetrics(initialVals);
      onResultsChangeRef.current(results, initialVals);
    } catch (error) {
      console.error('Initial calculation error:', error);
    }

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <PurchaseSection register={register} errors={errors} />
      <FinancingSection register={register} errors={errors} />
      <UnitConfigSection
        register={register}
        errors={errors}
        numberOfUnits={numberOfUnits}
        ownerUnit={ownerUnit}
      />
      <ExpensesSection register={register} errors={errors} />
    </div>
  );
}
