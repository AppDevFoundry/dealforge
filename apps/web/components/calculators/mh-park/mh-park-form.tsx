'use client';

import type { MhParkInputs, MhParkResults } from '@dealforge/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';

import { calculateMhParkMetrics } from '@/lib/calculations/mh-park';
import { MH_PARK_DEFAULTS } from '@/lib/constants/mh-park-defaults';

import { FinancingSection, PropertySection, PurchaseSection } from './mh-park-form-sections';
import { mhParkInputSchema } from './mh-park-schema';

interface MhParkFormProps {
  onResultsChange: (results: MhParkResults | null, inputs: MhParkInputs | null) => void;
  initialValues?: Partial<MhParkInputs>;
}

export function MhParkForm({ onResultsChange, initialValues }: MhParkFormProps) {
  const {
    register,
    watch,
    formState: { errors },
    getValues,
  } = useForm<MhParkInputs>({
    resolver: zodResolver(mhParkInputSchema),
    defaultValues: {
      ...MH_PARK_DEFAULTS,
      ...initialValues,
    },
    mode: 'onChange',
  });

  const onResultsChangeRef = useRef(onResultsChange);
  onResultsChangeRef.current = onResultsChange;

  useEffect(() => {
    const subscription = watch(() => {
      const values = getValues();
      try {
        const results = calculateMhParkMetrics(values);
        onResultsChangeRef.current(results, values);
      } catch {
        onResultsChangeRef.current(null, null);
      }
    });

    // Calculate initial results
    try {
      const values = getValues();
      const results = calculateMhParkMetrics(values);
      onResultsChangeRef.current(results, values);
    } catch {
      // ignore initial calculation errors
    }

    return () => subscription.unsubscribe();
  }, [watch, getValues]);

  return (
    <div className="space-y-6">
      <PropertySection register={register} errors={errors} />
      <PurchaseSection register={register} errors={errors} />
      <FinancingSection register={register} errors={errors} />
    </div>
  );
}
