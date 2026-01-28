'use client';

import type { CreateLeadInput } from '@dealforge/types';
import { DollarSign } from 'lucide-react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FinancialsStepProps {
  register: UseFormRegister<CreateLeadInput>;
  errors: FieldErrors<CreateLeadInput>;
}

interface CurrencyFieldProps {
  label: string;
  name: keyof CreateLeadInput;
  register: UseFormRegister<CreateLeadInput>;
  error?: { message?: string };
  placeholder?: string;
  description?: string;
}

function CurrencyField({
  label,
  name,
  register,
  error,
  placeholder,
  description,
}: CurrencyFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
        <Input
          id={name}
          type="number"
          placeholder={placeholder}
          className="pl-7 tabular-nums"
          {...register(name)}
        />
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {error?.message && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
}

export function FinancialsStep({ register, errors }: FinancialsStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Financial Information
        </CardTitle>
        <CardDescription>
          Enter pricing and financial details. All fields are optional.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CurrencyField
            label="Asking Price"
            name="askingPrice"
            register={register}
            error={errors.askingPrice}
            placeholder="e.g., 150000"
          />

          <CurrencyField
            label="Estimated Value (ARV)"
            name="estimatedValue"
            register={register}
            error={errors.estimatedValue}
            placeholder="e.g., 180000"
            description="Your estimate of the property value"
          />

          <CurrencyField
            label="Monthly Lot Rent"
            name="lotRent"
            register={register}
            error={errors.lotRent}
            placeholder="e.g., 450"
            description="For parks: average lot rent per month"
          />

          <CurrencyField
            label="Monthly Income"
            name="monthlyIncome"
            register={register}
            error={errors.monthlyIncome}
            placeholder="e.g., 25000"
            description="Current monthly gross income"
          />

          <CurrencyField
            label="Annual Taxes"
            name="annualTaxes"
            register={register}
            error={errors.annualTaxes}
            placeholder="e.g., 3500"
          />

          <CurrencyField
            label="Annual Insurance"
            name="annualInsurance"
            register={register}
            error={errors.annualInsurance}
            placeholder="e.g., 1200"
          />
        </div>
      </CardContent>
    </Card>
  );
}
