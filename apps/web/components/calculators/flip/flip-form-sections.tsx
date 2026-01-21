'use client';

import type { FlipInputs } from '@dealforge/types';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface FormSectionProps {
  register: UseFormRegister<FlipInputs>;
  errors: FieldErrors<FlipInputs>;
}

interface FinancingSectionProps extends FormSectionProps {
  useLoan: boolean;
  onUseLoanChange: (checked: boolean) => void;
}

interface FormFieldProps {
  label: string;
  name: keyof FlipInputs;
  register: UseFormRegister<FlipInputs>;
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
        <CardTitle className="text-lg headline-premium">Purchase & ARV</CardTitle>
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
          label="Closing Costs (Buy)"
          name="closingCostsBuy"
          prefix="$"
          register={register}
          error={errors.closingCostsBuy}
        />
        <FormField
          label="After Repair Value (ARV)"
          name="afterRepairValue"
          prefix="$"
          register={register}
          error={errors.afterRepairValue}
        />
      </CardContent>
    </Card>
  );
}

export function RehabHoldingSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Rehab & Holding</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Rehab Costs"
          name="rehabCosts"
          prefix="$"
          register={register}
          error={errors.rehabCosts}
        />
        <FormField
          label="Holding Period"
          name="holdingPeriodMonths"
          suffix="months"
          register={register}
          error={errors.holdingPeriodMonths}
        />
        <FormField
          label="Monthly Holding Costs"
          name="holdingCostsMonthly"
          prefix="$"
          register={register}
          error={errors.holdingCostsMonthly}
        />
      </CardContent>
    </Card>
  );
}

export function FinancingSection({
  register,
  errors,
  useLoan,
  onUseLoanChange,
}: FinancingSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Financing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="useLoan" className="text-sm font-medium">
            Use Loan
          </Label>
          <Switch id="useLoan" checked={useLoan} onCheckedChange={onUseLoanChange} />
        </div>
        {useLoan && (
          <div className="space-y-4 animate-fade-in">
            <FormField
              label="Loan Amount"
              name="loanAmount"
              prefix="$"
              register={register}
              error={errors.loanAmount}
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
              label="Loan Points"
              name="pointsPercent"
              suffix="%"
              step="0.1"
              register={register}
              error={errors.pointsPercent}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SellingCostsSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Selling Costs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Agent Commission"
          name="agentCommissionPercent"
          suffix="%"
          step="0.1"
          register={register}
          error={errors.agentCommissionPercent}
        />
        <FormField
          label="Closing Costs (Sell)"
          name="closingCostsSell"
          prefix="$"
          register={register}
          error={errors.closingCostsSell}
        />
      </CardContent>
    </Card>
  );
}
