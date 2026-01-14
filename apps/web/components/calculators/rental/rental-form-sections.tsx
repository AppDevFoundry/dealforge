'use client';

import type { RentalInputs } from '@dealforge/types';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormSectionProps {
  register: UseFormRegister<RentalInputs>;
  errors: FieldErrors<RentalInputs>;
}

interface FormFieldProps {
  label: string;
  name: keyof RentalInputs;
  register: UseFormRegister<RentalInputs>;
  error?: { message?: string };
  prefix?: string;
  suffix?: string;
  step?: string;
}

function FormField({ label, name, register, error, prefix, suffix, step = '1' }: FormFieldProps) {
  return (
    <div className="space-y-2 group/field">
      <Label htmlFor={name} className="text-sm font-medium transition-colors group-focus-within/field:text-primary">
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
      {error?.message && (
        <p className="text-sm text-destructive animate-fade-in">{error.message}</p>
      )}
    </div>
  );
}

export function PurchaseSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Purchase Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Purchase Price"
          name="purchasePrice"
          prefix="$"
          register={register}
          error={errors.purchasePrice}
        />
        <FormField
          label="Closing Costs"
          name="closingCosts"
          prefix="$"
          register={register}
          error={errors.closingCosts}
        />
        <FormField
          label="Rehab/Repair Costs"
          name="rehabCosts"
          prefix="$"
          register={register}
          error={errors.rehabCosts}
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
          step="0.1"
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
      </CardContent>
    </Card>
  );
}

export function IncomeSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Income</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Monthly Rent"
          name="monthlyRent"
          prefix="$"
          register={register}
          error={errors.monthlyRent}
        />
        <FormField
          label="Other Monthly Income"
          name="otherIncome"
          prefix="$"
          register={register}
          error={errors.otherIncome}
        />
        <FormField
          label="Vacancy Rate"
          name="vacancyRate"
          suffix="%"
          step="0.1"
          register={register}
          error={errors.vacancyRate}
        />
      </CardContent>
    </Card>
  );
}

export function ExpensesSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Expenses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Property Tax (Annual)"
          name="propertyTaxAnnual"
          prefix="$"
          register={register}
          error={errors.propertyTaxAnnual}
        />
        <FormField
          label="Insurance (Annual)"
          name="insuranceAnnual"
          prefix="$"
          register={register}
          error={errors.insuranceAnnual}
        />
        <FormField
          label="HOA (Monthly)"
          name="hoaMonthly"
          prefix="$"
          register={register}
          error={errors.hoaMonthly}
        />
        <FormField
          label="Maintenance"
          name="maintenancePercent"
          suffix="% of rent"
          step="0.1"
          register={register}
          error={errors.maintenancePercent}
        />
        <FormField
          label="CapEx Reserve"
          name="capexPercent"
          suffix="% of rent"
          step="0.1"
          register={register}
          error={errors.capexPercent}
        />
        <FormField
          label="Property Management"
          name="managementPercent"
          suffix="% of rent"
          step="0.1"
          register={register}
          error={errors.managementPercent}
        />
      </CardContent>
    </Card>
  );
}
