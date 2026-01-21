'use client';

import type { SyndicationInputs } from '@dealforge/types';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormSectionProps {
  register: UseFormRegister<SyndicationInputs>;
  errors: FieldErrors<SyndicationInputs>;
}

interface FormFieldProps {
  label: string;
  name: keyof SyndicationInputs;
  register: UseFormRegister<SyndicationInputs>;
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

export function CapitalStructureSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Capital Structure</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Total Capitalization"
          name="totalCapitalization"
          prefix="$"
          register={register}
          error={errors.totalCapitalization}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="LP Equity"
            name="lpEquityPercent"
            suffix="%"
            step="1"
            register={register}
            error={errors.lpEquityPercent}
          />
          <FormField
            label="GP Equity"
            name="gpEquityPercent"
            suffix="%"
            step="1"
            register={register}
            error={errors.gpEquityPercent}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function FeesSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Fees</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Acquisition Fee"
          name="acquisitionFeePercent"
          suffix="%"
          step="0.1"
          register={register}
          error={errors.acquisitionFeePercent}
        />
        <FormField
          label="Asset Management Fee (Annual)"
          name="assetManagementFeePercent"
          suffix="%"
          step="0.1"
          register={register}
          error={errors.assetManagementFeePercent}
        />
      </CardContent>
    </Card>
  );
}

export function WaterfallSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Waterfall Structure</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Preferred Return (to LPs)"
          name="preferredReturnPercent"
          suffix="%"
          step="0.1"
          register={register}
          error={errors.preferredReturnPercent}
        />

        <div className="border-t pt-4 mt-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            Tier 2: After Preferred Return
          </p>
          <div className="grid grid-cols-3 gap-2">
            <FormField
              label="LP Split"
              name="tier2LpPercent"
              suffix="%"
              register={register}
              error={errors.tier2LpPercent}
            />
            <FormField
              label="GP Split"
              name="tier2GpPercent"
              suffix="%"
              register={register}
              error={errors.tier2GpPercent}
            />
            <FormField
              label="IRR Hurdle"
              name="tier2IrrHurdle"
              suffix="%"
              step="0.1"
              register={register}
              error={errors.tier2IrrHurdle}
            />
          </div>
        </div>

        <div className="border-t pt-4 mt-2">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            Tier 3: After Tier 2 Hurdle
          </p>
          <div className="grid grid-cols-3 gap-2">
            <FormField
              label="LP Split"
              name="tier3LpPercent"
              suffix="%"
              register={register}
              error={errors.tier3LpPercent}
            />
            <FormField
              label="GP Split"
              name="tier3GpPercent"
              suffix="%"
              register={register}
              error={errors.tier3GpPercent}
            />
            <FormField
              label="IRR Hurdle"
              name="tier3IrrHurdle"
              suffix="%"
              step="0.1"
              register={register}
              error={errors.tier3IrrHurdle}
            />
          </div>
        </div>

        <div className="border-t pt-4 mt-2">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            Tier 4: After Tier 3 Hurdle
          </p>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="LP Split"
              name="tier4LpPercent"
              suffix="%"
              register={register}
              error={errors.tier4LpPercent}
            />
            <FormField
              label="GP Split"
              name="tier4GpPercent"
              suffix="%"
              register={register}
              error={errors.tier4GpPercent}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OperationsSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Operations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Hold Period"
          name="holdPeriodYears"
          suffix="years"
          register={register}
          error={errors.holdPeriodYears}
        />
        <FormField
          label="Year 1 NOI"
          name="year1NOI"
          prefix="$"
          register={register}
          error={errors.year1NOI}
        />
        <FormField
          label="NOI Growth"
          name="noiGrowthPercent"
          suffix="% / yr"
          step="0.1"
          register={register}
          error={errors.noiGrowthPercent}
        />
      </CardContent>
    </Card>
  );
}

export function ExitSection({ register, errors }: FormSectionProps) {
  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg headline-premium">Exit Assumptions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Exit Cap Rate"
          name="exitCapRate"
          suffix="%"
          step="0.1"
          register={register}
          error={errors.exitCapRate}
        />
        <FormField
          label="Exit Costs"
          name="exitCostPercent"
          suffix="%"
          step="0.1"
          register={register}
          error={errors.exitCostPercent}
        />
      </CardContent>
    </Card>
  );
}
