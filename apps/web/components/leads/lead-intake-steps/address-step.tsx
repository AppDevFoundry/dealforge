'use client';

import type { CreateLeadInput } from '@dealforge/types';
import { MapPin } from 'lucide-react';
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddressStepProps {
  register: UseFormRegister<CreateLeadInput>;
  errors: FieldErrors<CreateLeadInput>;
  setValue: UseFormSetValue<CreateLeadInput>;
  watch: UseFormWatch<CreateLeadInput>;
}

export function AddressStep({ register, errors }: AddressStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Property Address
        </CardTitle>
        <CardDescription>
          Enter the full property address. We'll automatically gather location intelligence.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            placeholder="123 Main St, San Antonio, TX 78201"
            {...register('address')}
            className="text-lg"
          />
          {errors.address?.message && (
            <p className="text-sm text-destructive">{errors.address.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Include street address, city, state, and ZIP code for best results
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
