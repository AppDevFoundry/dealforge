'use client';

import type { HouseHackInputs } from '@dealforge/types';
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FINANCING_TYPES, UNIT_COUNT_OPTIONS } from '@/lib/constants/house-hack-defaults';

interface FormSectionProps {
  register: UseFormRegister<HouseHackInputs>;
  errors: FieldErrors<HouseHackInputs>;
  watch?: UseFormWatch<HouseHackInputs>;
  setValue?: UseFormSetValue<HouseHackInputs>;
}

interface FormFieldProps {
  label: string;
  name: keyof HouseHackInputs;
  register: UseFormRegister<HouseHackInputs>;
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

interface PurchaseFinancingSectionProps extends FormSectionProps {
  watch: UseFormWatch<HouseHackInputs>;
  setValue: UseFormSetValue<HouseHackInputs>;
}

export function PurchaseFinancingSection({
  register,
  errors,
  watch,
  setValue,
}: PurchaseFinancingSectionProps) {
  const financingType = watch('financingType');
  const downPaymentPercent = watch('downPaymentPercent');
  const isCash = financingType === 'cash';

  // Get minimum down payment for selected financing type
  const selectedFinancing = FINANCING_TYPES.find((f) => f.value === financingType);
  const minDown = selectedFinancing?.minDown ?? 3.5;

  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Purchase & Financing</CardTitle>
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

        <div className="space-y-2">
          <Label htmlFor="financingType" className="text-sm font-medium">
            Financing Type
          </Label>
          <Select
            value={financingType}
            onValueChange={(value: HouseHackInputs['financingType']) => {
              setValue('financingType', value);
              // Auto-adjust down payment to minimum for selected type
              const newMin = FINANCING_TYPES.find((f) => f.value === value)?.minDown ?? 3.5;
              if (downPaymentPercent < newMin) {
                setValue('downPaymentPercent', newMin);
              }
            }}
          >
            <SelectTrigger id="financingType">
              <SelectValue placeholder="Select financing type" />
            </SelectTrigger>
            <SelectContent>
              {FINANCING_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FormField
          label="Down Payment"
          name="downPaymentPercent"
          suffix={`% (min ${minDown}%)`}
          step="0.5"
          register={register}
          error={errors.downPaymentPercent}
          disabled={isCash}
        />
        <FormField
          label="Interest Rate"
          name="interestRate"
          suffix="%"
          step="0.125"
          register={register}
          error={errors.interestRate}
          disabled={isCash}
        />
        <FormField
          label="Loan Term"
          name="loanTermYears"
          suffix="years"
          register={register}
          error={errors.loanTermYears}
          disabled={isCash}
        />
        <FormField
          label="PMI Rate (Annual)"
          name="pmiRate"
          suffix="%"
          step="0.05"
          register={register}
          error={errors.pmiRate}
          disabled={isCash || downPaymentPercent >= 20}
        />
        {!isCash && downPaymentPercent < 20 && (
          <p className="text-xs text-muted-foreground">
            PMI required with less than 20% down. FHA loans have MIP for the life of the loan.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface PropertyStructureSectionProps extends FormSectionProps {
  watch: UseFormWatch<HouseHackInputs>;
  setValue: UseFormSetValue<HouseHackInputs>;
}

export function PropertyStructureSection({
  errors,
  watch,
  setValue,
}: PropertyStructureSectionProps) {
  const numberOfUnits = watch('numberOfUnits');
  const ownerOccupiedUnit = watch('ownerOccupiedUnit');

  // Generate unit options based on number of units
  const unitOptions = Array.from({ length: numberOfUnits }, (_, i) => ({
    value: i + 1,
    label: `Unit ${i + 1}`,
  }));

  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Property Structure</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="numberOfUnits" className="text-sm font-medium">
            Number of Units
          </Label>
          <Select
            value={String(numberOfUnits)}
            onValueChange={(value) => {
              const units = Number(value) as 2 | 3 | 4;
              setValue('numberOfUnits', units);
              // Reset owner unit if it exceeds new unit count
              if (ownerOccupiedUnit > units) {
                setValue('ownerOccupiedUnit', 1);
              }
            }}
          >
            <SelectTrigger id="numberOfUnits">
              <SelectValue placeholder="Select number of units" />
            </SelectTrigger>
            <SelectContent>
              {UNIT_COUNT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.numberOfUnits?.message && (
            <p className="text-sm text-destructive">{errors.numberOfUnits.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ownerOccupiedUnit" className="text-sm font-medium">
            Which Unit Do You Live In?
          </Label>
          <Select
            value={String(ownerOccupiedUnit)}
            onValueChange={(value) => setValue('ownerOccupiedUnit', Number(value))}
          >
            <SelectTrigger id="ownerOccupiedUnit">
              <SelectValue placeholder="Select your unit" />
            </SelectTrigger>
            <SelectContent>
              {unitOptions.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.ownerOccupiedUnit?.message && (
            <p className="text-sm text-destructive">{errors.ownerOccupiedUnit.message}</p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          FHA and VA loans allow owner-occupied financing on 2-4 unit properties with lower down
          payments than investment properties.
        </p>
      </CardContent>
    </Card>
  );
}

interface UnitRentsSectionProps extends FormSectionProps {
  watch: UseFormWatch<HouseHackInputs>;
}

export function UnitRentsSection({ register, errors, watch }: UnitRentsSectionProps) {
  const numberOfUnits = watch('numberOfUnits');
  const ownerOccupiedUnit = watch('ownerOccupiedUnit');

  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Unit Rents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label={`Unit 1 ${ownerOccupiedUnit === 1 ? '(Your Unit - Potential Rent)' : 'Monthly Rent'}`}
          name="unit1Rent"
          prefix="$"
          register={register}
          error={errors.unit1Rent}
        />
        <FormField
          label={`Unit 2 ${ownerOccupiedUnit === 2 ? '(Your Unit - Potential Rent)' : 'Monthly Rent'}`}
          name="unit2Rent"
          prefix="$"
          register={register}
          error={errors.unit2Rent}
        />
        {numberOfUnits >= 3 && (
          <FormField
            label={`Unit 3 ${ownerOccupiedUnit === 3 ? '(Your Unit - Potential Rent)' : 'Monthly Rent'}`}
            name="unit3Rent"
            prefix="$"
            register={register}
            error={errors.unit3Rent}
          />
        )}
        {numberOfUnits >= 4 && (
          <FormField
            label={`Unit 4 ${ownerOccupiedUnit === 4 ? '(Your Unit - Potential Rent)' : 'Monthly Rent'}`}
            name="unit4Rent"
            prefix="$"
            register={register}
            error={errors.unit4Rent}
          />
        )}
        <p className="text-xs text-muted-foreground">
          Enter market rent for all units. Your unit's rent shows what you could collect if you
          moved out.
        </p>
      </CardContent>
    </Card>
  );
}

export function OwnerComparisonSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Your Housing Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Equivalent Rent (What You'd Pay Elsewhere)"
          name="equivalentRent"
          prefix="$"
          register={register}
          error={errors.equivalentRent}
        />
        <p className="text-xs text-muted-foreground">
          Enter what you would pay in rent for comparable housing if you didn't house hack. This is
          used to calculate your true savings.
        </p>
      </CardContent>
    </Card>
  );
}

export function OperatingExpensesSection({ register, errors }: FormSectionProps) {
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
          label="Maintenance Reserve"
          name="maintenancePercent"
          suffix="% of rent"
          step="0.5"
          register={register}
          error={errors.maintenancePercent}
        />
        <FormField
          label="CapEx Reserve"
          name="capexPercent"
          suffix="% of rent"
          step="0.5"
          register={register}
          error={errors.capexPercent}
        />
        <FormField
          label="Owner-Paid Utilities (Monthly)"
          name="utilitiesMonthly"
          prefix="$"
          register={register}
          error={errors.utilitiesMonthly}
        />
        <p className="text-xs text-muted-foreground">
          Include common area utilities, trash, water, or any utilities you pay for tenants.
        </p>
      </CardContent>
    </Card>
  );
}

export function VacancyManagementSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Vacancy & Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Vacancy Rate"
          name="vacancyRate"
          suffix="%"
          step="1"
          register={register}
          error={errors.vacancyRate}
        />
        <FormField
          label="Property Management"
          name="managementPercent"
          suffix="% of rent"
          step="1"
          register={register}
          error={errors.managementPercent}
        />
        <p className="text-xs text-muted-foreground">
          Many house hackers self-manage (0%), but budget 8-10% if hiring a property manager.
          Vacancy only applies to rented units.
        </p>
      </CardContent>
    </Card>
  );
}
