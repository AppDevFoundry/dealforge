'use client';

import type { MultifamilyInputs } from '@dealforge/types';
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface FormSectionProps {
  register: UseFormRegister<MultifamilyInputs>;
  errors: FieldErrors<MultifamilyInputs>;
  watch?: UseFormWatch<MultifamilyInputs>;
  setValue?: UseFormSetValue<MultifamilyInputs>;
}

interface FormFieldProps {
  label: string;
  name: keyof MultifamilyInputs;
  register: UseFormRegister<MultifamilyInputs>;
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

export function PropertyInfoSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Property Information</CardTitle>
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
          name="closingCostsPercent"
          suffix="% of price"
          step="0.1"
          register={register}
          error={errors.closingCostsPercent}
        />
        <FormField
          label="Total Units"
          name="totalUnits"
          suffix="units"
          register={register}
          error={errors.totalUnits}
        />
        <FormField
          label="Total Square Footage"
          name="squareFootage"
          suffix="sq ft"
          register={register}
          error={errors.squareFootage}
        />
      </CardContent>
    </Card>
  );
}

interface UnitMixSectionProps extends FormSectionProps {
  watch: UseFormWatch<MultifamilyInputs>;
}

export function UnitMixSection({ register, errors, watch }: UnitMixSectionProps) {
  const studioCount = watch('studioCount') || 0;
  const oneBedCount = watch('oneBedCount') || 0;
  const twoBedCount = watch('twoBedCount') || 0;
  const threeBedCount = watch('threeBedCount') || 0;
  const totalUnits = studioCount + oneBedCount + twoBedCount + threeBedCount;

  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Unit Mix</CardTitle>
        <p className="text-xs text-muted-foreground">Total from mix: {totalUnits} units</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Studios */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Studio Count"
            name="studioCount"
            suffix="units"
            register={register}
            error={errors.studioCount}
          />
          <FormField
            label="Studio Rent"
            name="studioRent"
            prefix="$"
            suffix="/mo"
            register={register}
            error={errors.studioRent}
          />
        </div>

        {/* 1 Bedrooms */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="1 Bedroom Count"
            name="oneBedCount"
            suffix="units"
            register={register}
            error={errors.oneBedCount}
          />
          <FormField
            label="1 Bedroom Rent"
            name="oneBedRent"
            prefix="$"
            suffix="/mo"
            register={register}
            error={errors.oneBedRent}
          />
        </div>

        {/* 2 Bedrooms */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="2 Bedroom Count"
            name="twoBedCount"
            suffix="units"
            register={register}
            error={errors.twoBedCount}
          />
          <FormField
            label="2 Bedroom Rent"
            name="twoBedRent"
            prefix="$"
            suffix="/mo"
            register={register}
            error={errors.twoBedRent}
          />
        </div>

        {/* 3 Bedrooms */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="3 Bedroom Count"
            name="threeBedCount"
            suffix="units"
            register={register}
            error={errors.threeBedCount}
          />
          <FormField
            label="3 Bedroom Rent"
            name="threeBedRent"
            prefix="$"
            suffix="/mo"
            register={register}
            error={errors.threeBedRent}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function OtherIncomeSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Other Income (Monthly)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Laundry Income"
          name="laundryIncome"
          prefix="$"
          suffix="/mo"
          register={register}
          error={errors.laundryIncome}
        />
        <FormField
          label="Parking Income"
          name="parkingIncome"
          prefix="$"
          suffix="/mo"
          register={register}
          error={errors.parkingIncome}
        />
        <FormField
          label="Storage Income"
          name="storageIncome"
          prefix="$"
          suffix="/mo"
          register={register}
          error={errors.storageIncome}
        />
        <FormField
          label="Pet Fees"
          name="petFees"
          prefix="$"
          suffix="/mo"
          register={register}
          error={errors.petFees}
        />
        <FormField
          label="Other Income"
          name="otherIncome"
          prefix="$"
          suffix="/mo"
          register={register}
          error={errors.otherIncome}
        />
      </CardContent>
    </Card>
  );
}

export function VacancyLossSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Vacancy & Credit Loss</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Vacancy Rate"
          name="vacancyRate"
          suffix="%"
          step="0.5"
          register={register}
          error={errors.vacancyRate}
        />
        <FormField
          label="Credit Loss Rate"
          name="creditLossRate"
          suffix="%"
          step="0.5"
          register={register}
          error={errors.creditLossRate}
        />
        <p className="text-xs text-muted-foreground">
          Vacancy: expected unoccupied units. Credit loss: expected bad debt from non-paying
          tenants.
        </p>
      </CardContent>
    </Card>
  );
}

interface ExpensesSectionProps extends FormSectionProps {
  watch: UseFormWatch<MultifamilyInputs>;
  setValue: UseFormSetValue<MultifamilyInputs>;
}

export function ExpensesSection({ register, errors, watch, setValue }: ExpensesSectionProps) {
  const useExpenseRatio = watch('useExpenseRatio');

  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Operating Expenses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="useExpenseRatio" className="text-sm font-medium cursor-pointer">
            Use Expense Ratio (Quick Method)
          </Label>
          <Switch
            id="useExpenseRatio"
            checked={useExpenseRatio}
            onCheckedChange={(checked) => setValue('useExpenseRatio', checked)}
          />
        </div>

        {useExpenseRatio ? (
          <>
            <FormField
              label="Expense Ratio"
              name="expenseRatio"
              suffix="% of EGI"
              step="1"
              register={register}
              error={errors.expenseRatio}
            />
            <p className="text-xs text-muted-foreground">
              Typical expense ratios: Class A (35-45%), Class B (40-50%), Class C (45-55%)
            </p>
          </>
        ) : (
          <div className="space-y-4">
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
              label="Utilities (Annual)"
              name="utilitiesAnnual"
              prefix="$"
              register={register}
              error={errors.utilitiesAnnual}
            />
            <FormField
              label="Repairs & Maintenance (Annual)"
              name="repairsMaintenanceAnnual"
              prefix="$"
              register={register}
              error={errors.repairsMaintenanceAnnual}
            />
            <FormField
              label="Management Fee"
              name="managementPercent"
              suffix="% of rent"
              step="0.5"
              register={register}
              error={errors.managementPercent}
            />
            <FormField
              label="Payroll (Annual)"
              name="payrollAnnual"
              prefix="$"
              register={register}
              error={errors.payrollAnnual}
            />
            <FormField
              label="Advertising (Annual)"
              name="advertisingAnnual"
              prefix="$"
              register={register}
              error={errors.advertisingAnnual}
            />
            <FormField
              label="Legal & Accounting (Annual)"
              name="legalAccountingAnnual"
              prefix="$"
              register={register}
              error={errors.legalAccountingAnnual}
            />
            <FormField
              label="Landscaping (Annual)"
              name="landscapingAnnual"
              prefix="$"
              register={register}
              error={errors.landscapingAnnual}
            />
            <FormField
              label="Contract Services (Annual)"
              name="contractServicesAnnual"
              prefix="$"
              register={register}
              error={errors.contractServicesAnnual}
            />
            <FormField
              label="CapEx Reserves"
              name="reservesPercent"
              suffix="% of EGI"
              step="0.5"
              register={register}
              error={errors.reservesPercent}
            />
          </div>
        )}
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
          label="Amortization Period"
          name="amortizationYears"
          suffix="years"
          register={register}
          error={errors.amortizationYears}
        />
        <FormField
          label="Loan Points"
          name="loanPointsPercent"
          suffix="%"
          step="0.25"
          register={register}
          error={errors.loanPointsPercent}
        />
        <p className="text-xs text-muted-foreground">
          Commercial loans often have shorter terms (5-10 years) with longer amortization (25-30
          years), resulting in a balloon payment.
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
          The cap rate for similar properties in this market. Used to estimate market value. Lower
          cap rates = higher values (typically 4-8% for multi-family).
        </p>
      </CardContent>
    </Card>
  );
}
