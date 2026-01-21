'use client';

import type { HouseHackInputs } from '@dealforge/types';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormSectionProps {
  register: UseFormRegister<HouseHackInputs>;
  errors: FieldErrors<HouseHackInputs>;
}

interface UnitConfigSectionProps extends FormSectionProps {
  numberOfUnits: number;
  ownerUnit: number;
}

interface FormFieldProps {
  label: string;
  name: keyof HouseHackInputs;
  register: UseFormRegister<HouseHackInputs>;
  error?: { message?: string };
  prefix?: string;
  suffix?: string;
  step?: string;
}

function FormField({ label, name, register, error, prefix, suffix, step = '1' }: FormFieldProps) {
  return (
    <div className="space-y-2 group/field">
      <Label
        htmlFor={name}
        className="text-sm font-medium transition-colors group-focus-within/field:text-primary"
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

export function UnitConfigSection({
  register,
  errors,
  numberOfUnits,
  ownerUnit,
}: UnitConfigSectionProps) {
  const unitRentFields: { label: string; name: keyof HouseHackInputs }[] = [
    { label: 'Unit 1 Rent', name: 'unit1Rent' },
    { label: 'Unit 2 Rent', name: 'unit2Rent' },
    { label: 'Unit 3 Rent', name: 'unit3Rent' },
    { label: 'Unit 4 Rent', name: 'unit4Rent' },
  ];

  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Unit Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Number of Units"
          name="numberOfUnits"
          register={register}
          error={errors.numberOfUnits}
        />
        <FormField
          label="Owner-Occupied Unit"
          name="ownerUnit"
          register={register}
          error={errors.ownerUnit}
        />

        <div className="border-t pt-4 mt-4">
          <p className="text-sm font-medium text-muted-foreground mb-3">Monthly Rents</p>
          {unitRentFields.map((field, index) => {
            const unitNumber = index + 1;
            if (unitNumber > numberOfUnits) return null;
            if (unitNumber === ownerUnit) {
              return (
                <div key={field.name} className="space-y-2 mb-4 group/field">
                  <Label className="text-sm font-medium text-muted-foreground">
                    {field.label}{' '}
                    <span className="text-xs text-primary font-normal">(You live here)</span>
                  </Label>
                  <Input
                    type="number"
                    value={0}
                    disabled
                    className="pl-7 tabular-nums opacity-50"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                </div>
              );
            }
            return (
              <div key={field.name} className="mb-4">
                <FormField
                  label={field.label}
                  name={field.name}
                  prefix="$"
                  register={register}
                  error={errors[field.name]}
                />
              </div>
            );
          })}
        </div>

        <FormField
          label="Your Equivalent Rent (if renting elsewhere)"
          name="ownerEquivalentRent"
          prefix="$"
          register={register}
          error={errors.ownerEquivalentRent}
        />
      </CardContent>
    </Card>
  );
}

export function ExpensesSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Operating Expenses</CardTitle>
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
