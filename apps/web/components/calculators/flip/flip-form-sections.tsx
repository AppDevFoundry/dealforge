'use client';

import type { FlipInputs } from '@dealforge/types';
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface FormSectionProps {
  register: UseFormRegister<FlipInputs>;
  errors: FieldErrors<FlipInputs>;
  watch?: UseFormWatch<FlipInputs>;
}

interface FormFieldProps {
  label: string;
  name: keyof FlipInputs;
  register: UseFormRegister<FlipInputs>;
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

export function PurchaseRehabSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Purchase & Rehab</CardTitle>
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
          name="closingCostsBuyPercent"
          suffix="% of price"
          step="0.1"
          register={register}
          error={errors.closingCostsBuyPercent}
        />
        <FormField
          label="Rehab Budget"
          name="rehabCosts"
          prefix="$"
          register={register}
          error={errors.rehabCosts}
        />
      </CardContent>
    </Card>
  );
}

export function ArvSaleSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">ARV & Sale</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="After Repair Value (ARV)"
          name="afterRepairValue"
          prefix="$"
          register={register}
          error={errors.afterRepairValue}
        />
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
          name="closingCostsSellPercent"
          suffix="% of ARV"
          step="0.1"
          register={register}
          error={errors.closingCostsSellPercent}
        />
      </CardContent>
    </Card>
  );
}

export function HoldingSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Holding Period</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
        <p className="text-xs text-muted-foreground">
          Include utilities, property taxes, insurance, lawn care, and other monthly costs
        </p>
      </CardContent>
    </Card>
  );
}

interface FinancingSectionProps extends FormSectionProps {
  watch: UseFormWatch<FlipInputs>;
  setValue: UseFormSetValue<FlipInputs>;
}

export function FinancingSection({ register, errors, watch, setValue }: FinancingSectionProps) {
  const useLoan = watch('useLoan');
  const includeRehabInLoan = watch('includeRehabInLoan');

  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Financing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="useLoan" className="text-sm font-medium cursor-pointer">
            Use Financing (Hard Money / Private Loan)
          </Label>
          <Switch
            id="useLoan"
            checked={useLoan}
            onCheckedChange={(checked) => setValue('useLoan', checked)}
          />
        </div>

        <FormField
          label="Loan to Value (LTV)"
          name="loanToValuePercent"
          suffix="%"
          step="1"
          register={register}
          error={errors.loanToValuePercent}
          disabled={!useLoan}
        />
        <FormField
          label="Interest Rate"
          name="loanInterestRate"
          suffix="%"
          step="0.25"
          register={register}
          error={errors.loanInterestRate}
          disabled={!useLoan}
        />
        <FormField
          label="Origination Points"
          name="loanPointsPercent"
          suffix="%"
          step="0.25"
          register={register}
          error={errors.loanPointsPercent}
          disabled={!useLoan}
        />

        <div className="flex items-center justify-between">
          <Label
            htmlFor="includeRehabInLoan"
            className={`text-sm font-medium cursor-pointer ${!useLoan ? 'text-muted-foreground' : ''}`}
          >
            Include Rehab Costs in Loan
          </Label>
          <Switch
            id="includeRehabInLoan"
            checked={includeRehabInLoan}
            onCheckedChange={(checked) => setValue('includeRehabInLoan', checked)}
            disabled={!useLoan}
          />
        </div>
      </CardContent>
    </Card>
  );
}
