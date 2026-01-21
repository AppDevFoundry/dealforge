'use client';

import type { MhParkInputs } from '@dealforge/types';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormSectionProps {
  register: UseFormRegister<MhParkInputs>;
  errors: FieldErrors<MhParkInputs>;
}

interface FormFieldProps {
  label: string;
  name: keyof MhParkInputs;
  register: UseFormRegister<MhParkInputs>;
  error?: { message?: string };
  prefix?: string;
  suffix?: string;
  step?: string;
}

function FormField({ label, name, register, error, prefix, suffix, step = '1' }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {prefix}
          </span>
        )}
        <Input
          id={name}
          type="number"
          step={step}
          {...register(name, { valueAsNumber: true })}
          className={`${prefix ? 'pl-7' : ''} ${suffix ? 'pr-14' : ''} tabular-nums`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
            {suffix}
          </span>
        )}
      </div>
      {error?.message && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
}

export function PropertySection({ register, errors }: FormSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Property</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Number of Lots"
          name="lotCount"
          register={register}
          error={errors.lotCount}
        />
        <FormField
          label="Average Lot Rent"
          name="averageLotRent"
          prefix="$"
          suffix="/mo"
          register={register}
          error={errors.averageLotRent}
        />
        <FormField
          label="Occupancy Rate"
          name="occupancyRate"
          suffix="%"
          step="0.1"
          register={register}
          error={errors.occupancyRate}
        />
        <FormField
          label="Expense Ratio"
          name="expenseRatio"
          suffix="%"
          step="0.1"
          register={register}
          error={errors.expenseRatio}
        />
      </CardContent>
    </Card>
  );
}

export function PurchaseSection({ register, errors }: FormSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Purchase</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Purchase Price"
          name="purchasePrice"
          prefix="$"
          register={register}
          error={errors.purchasePrice}
        />
      </CardContent>
    </Card>
  );
}

export function FinancingSection({ register, errors }: FormSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Financing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Down Payment"
          name="downPaymentPercent"
          suffix="%"
          step="0.1"
          register={register}
          error={errors.downPaymentPercent}
        />
        <FormField
          label="Interest Rate"
          name="interestRate"
          suffix="%"
          step="0.01"
          register={register}
          error={errors.interestRate}
        />
        <FormField
          label="Loan Term"
          name="loanTermYears"
          suffix="years"
          register={register}
          error={errors.loanTermYears}
        />
        <FormField
          label="Amortization"
          name="amortizationYears"
          suffix="years"
          register={register}
          error={errors.amortizationYears}
        />
      </CardContent>
    </Card>
  );
}
