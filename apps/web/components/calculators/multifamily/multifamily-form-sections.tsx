'use client';

import type { MultifamilyInputs } from '@dealforge/types';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface FormSectionProps {
  register: UseFormRegister<MultifamilyInputs>;
  errors: FieldErrors<MultifamilyInputs>;
}

interface ExpensesSectionProps extends FormSectionProps {
  useExpenseRatio: boolean;
  onExpenseRatioChange: (checked: boolean) => void;
}

interface FormFieldProps {
  label: string;
  name: keyof MultifamilyInputs;
  register: UseFormRegister<MultifamilyInputs>;
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
        <FormField
          label="Number of Units"
          name="numberOfUnits"
          register={register}
          error={errors.numberOfUnits}
        />
      </CardContent>
    </Card>
  );
}

export function UnitMixSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Unit Mix</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground -mt-2">
          Define your unit count and rent by bedroom type
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="1BR Units"
              name="units1BR"
              register={register}
              error={errors.units1BR}
            />
            <FormField
              label="1BR Rent"
              name="rent1BR"
              prefix="$"
              register={register}
              error={errors.rent1BR}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="2BR Units"
              name="units2BR"
              register={register}
              error={errors.units2BR}
            />
            <FormField
              label="2BR Rent"
              name="rent2BR"
              prefix="$"
              register={register}
              error={errors.rent2BR}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="3BR Units"
              name="units3BR"
              register={register}
              error={errors.units3BR}
            />
            <FormField
              label="3BR Rent"
              name="rent3BR"
              prefix="$"
              register={register}
              error={errors.rent3BR}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OtherIncomeSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Other Income</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Laundry"
          name="laundryMonthly"
          prefix="$"
          suffix="/mo"
          register={register}
          error={errors.laundryMonthly}
        />
        <FormField
          label="Parking"
          name="parkingMonthly"
          prefix="$"
          suffix="/mo"
          register={register}
          error={errors.parkingMonthly}
        />
        <FormField
          label="Pet Fees"
          name="petFeesMonthly"
          prefix="$"
          suffix="/mo"
          register={register}
          error={errors.petFeesMonthly}
        />
        <FormField
          label="Storage"
          name="storageMonthly"
          prefix="$"
          suffix="/mo"
          register={register}
          error={errors.storageMonthly}
        />
      </CardContent>
    </Card>
  );
}

export function ExpensesSection({
  register,
  errors,
  useExpenseRatio,
  onExpenseRatioChange,
}: ExpensesSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Operating Expenses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label htmlFor="expense-ratio-toggle" className="text-sm font-medium cursor-pointer">
            Use Expense Ratio
          </Label>
          <Switch
            id="expense-ratio-toggle"
            checked={useExpenseRatio}
            onCheckedChange={onExpenseRatioChange}
          />
        </div>

        {useExpenseRatio ? (
          <FormField
            label="Expense Ratio"
            name="expenseRatio"
            suffix="% of EGI"
            step="0.1"
            register={register}
            error={errors.expenseRatio}
          />
        ) : (
          <>
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
              label="Utilities"
              name="utilitiesMonthly"
              prefix="$"
              suffix="/mo"
              register={register}
              error={errors.utilitiesMonthly}
            />
            <FormField
              label="Maintenance"
              name="maintenanceMonthly"
              prefix="$"
              suffix="/mo"
              register={register}
              error={errors.maintenanceMonthly}
            />
            <FormField
              label="Management"
              name="managementPercent"
              suffix="% of EGI"
              step="0.1"
              register={register}
              error={errors.managementPercent}
            />
            <FormField
              label="Payroll"
              name="payrollMonthly"
              prefix="$"
              suffix="/mo"
              register={register}
              error={errors.payrollMonthly}
            />
            <FormField
              label="Admin/Office"
              name="adminMonthly"
              prefix="$"
              suffix="/mo"
              register={register}
              error={errors.adminMonthly}
            />
            <FormField
              label="Contract Services"
              name="contractServicesMonthly"
              prefix="$"
              suffix="/mo"
              register={register}
              error={errors.contractServicesMonthly}
            />
            <FormField
              label="Replacement Reserves"
              name="replacementReservesMonthly"
              prefix="$"
              suffix="/mo"
              register={register}
              error={errors.replacementReservesMonthly}
            />
          </>
        )}

        <div className="border-t pt-4 mt-4">
          <FormField
            label="Vacancy Rate"
            name="vacancyRate"
            suffix="%"
            step="0.1"
            register={register}
            error={errors.vacancyRate}
          />
        </div>
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
        <FormField
          label="Market Cap Rate"
          name="marketCapRate"
          suffix="%"
          step="0.1"
          register={register}
          error={errors.marketCapRate}
        />
      </CardContent>
    </Card>
  );
}
