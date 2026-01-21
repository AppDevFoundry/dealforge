'use client';

import type { MhParkCalculatorInputs } from '@dealforge/types';
import type { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormSectionProps {
  register: UseFormRegister<MhParkCalculatorInputs>;
  errors: FieldErrors<MhParkCalculatorInputs>;
  watch?: UseFormWatch<MhParkCalculatorInputs>;
}

interface FormFieldProps {
  label: string;
  name: keyof MhParkCalculatorInputs;
  register: UseFormRegister<MhParkCalculatorInputs>;
  error?: { message?: string };
  prefix?: string;
  suffix?: string;
  step?: string;
  disabled?: boolean;
}

function FormField({
  label,
  name,
  register,
  error,
  prefix,
  suffix,
  step = '1',
  disabled = false,
}: FormFieldProps) {
  return (
    <div className="space-y-2 group/field">
      <Label
        htmlFor={name}
        className={`text-sm font-medium transition-colors group-focus-within/field:text-primary ${
          disabled ? 'text-muted-foreground' : ''
        }`}
      >
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
          disabled={disabled}
          {...register(name, { valueAsNumber: true })}
          className={`${prefix ? 'pl-7' : ''} ${suffix ? 'pr-14' : ''} tabular-nums ${
            disabled ? 'opacity-50' : ''
          }`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
            {suffix}
          </span>
        )}
      </div>
      {error?.message && (
        <p className="text-sm text-destructive animate-fade-in">{error.message}</p>
      )}
    </div>
  );
}

export function PropertyInfoSection({ register, errors, watch }: FormSectionProps) {
  const lotCount = watch?.('lotCount') || 0;
  const occupiedLots = watch?.('occupiedLots') || 0;
  const occupancyRate = lotCount > 0 ? ((occupiedLots / lotCount) * 100).toFixed(1) : '0';

  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Property Information</CardTitle>
        {lotCount > 0 && (
          <p className="text-xs text-muted-foreground">Occupancy: {occupancyRate}%</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Total Lots"
            name="lotCount"
            suffix="lots"
            register={register}
            error={errors.lotCount}
          />
          <FormField
            label="Occupied Lots"
            name="occupiedLots"
            suffix="lots"
            register={register}
            error={errors.occupiedLots}
          />
        </div>
        <FormField
          label="Average Lot Rent"
          name="avgLotRent"
          prefix="$"
          suffix="/mo"
          register={register}
          error={errors.avgLotRent}
        />
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
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Financing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Down Payment"
          name="downPaymentPercent"
          suffix="%"
          step="1"
          register={register}
          error={errors.downPaymentPercent}
        />
        <FormField
          label="Interest Rate"
          name="interestRate"
          suffix="%"
          step="0.125"
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
          label="Closing Costs"
          name="closingCostsPercent"
          suffix="% of price"
          step="0.1"
          register={register}
          error={errors.closingCostsPercent}
        />
        <p className="text-xs text-muted-foreground">
          MH park loans typically require 20-30% down with 15-25 year terms.
        </p>
      </CardContent>
    </Card>
  );
}

export function ExpensesSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Income & Expenses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Expense Ratio"
          name="expenseRatioPercent"
          suffix="% of EGI"
          step="1"
          register={register}
          error={errors.expenseRatioPercent}
        />
        <p className="text-xs text-muted-foreground">
          MH parks typically run 30-40% expense ratios (lower than apartments).
        </p>
        <FormField
          label="Other Monthly Income"
          name="otherIncomeMonthly"
          prefix="$"
          suffix="/mo"
          register={register}
          error={errors.otherIncomeMonthly}
        />
        <p className="text-xs text-muted-foreground">
          Laundry, late fees, application fees, storage, etc.
        </p>
      </CardContent>
    </Card>
  );
}

export function ValuationSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Valuation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Market Cap Rate"
          name="marketCapRate"
          suffix="%"
          step="0.25"
          register={register}
          error={errors.marketCapRate}
        />
        <p className="text-xs text-muted-foreground">
          MH parks typically trade at 7-10% cap rates. Primary markets 6-8%, secondary 8-10%, rural
          10-12%.
        </p>
      </CardContent>
    </Card>
  );
}
