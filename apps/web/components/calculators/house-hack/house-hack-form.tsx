'use client';

import type { HouseHackInputs, HouseHackResults } from '@dealforge/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { calculateHouseHackMetrics } from '@/lib/calculations/house-hack';
import { HOUSE_HACK_DEFAULTS } from '@/lib/constants/house-hack-defaults';

import {
  OperatingExpensesSection,
  OwnerComparisonSection,
  PropertyStructureSection,
  PurchaseFinancingSection,
  UnitRentsSection,
  VacancyManagementSection,
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
    setValue,
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
        const results = calculateHouseHackMetrics(values);
        onResultsChangeRef.current(results, values);
      } catch (error) {
        console.error('Calculation error:', error);
        onResultsChangeRef.current(null, null);
      }
    });

    // Calculate initial results
    try {
      const initialValues = getValues();
      const results = calculateHouseHackMetrics(initialValues);
      onResultsChangeRef.current(results, initialValues);
    } catch (error) {
      console.error('Initial calculation error:', error);
    }

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <PurchaseFinancingSection
        register={register}
        errors={errors}
        watch={watch}
        setValue={setValue}
      />
      <PropertyStructureSection
        register={register}
        errors={errors}
        watch={watch}
        setValue={setValue}
      />
      <UnitRentsSection register={register} errors={errors} watch={watch} />
      <OwnerComparisonSection register={register} errors={errors} />
      <OperatingExpensesSection register={register} errors={errors} />
      <VacancyManagementSection register={register} errors={errors} />
    </div>
  );
}
