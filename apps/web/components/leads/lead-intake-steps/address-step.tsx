'use client';

import { useState } from 'react';
import type { CreateLeadInput } from '@dealforge/types';
import { MapPin } from 'lucide-react';
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { Label } from '@/components/ui/label';
import type { AddressSuggestion } from '@/lib/shared/address-autocomplete';

interface AddressStepProps {
  register: UseFormRegister<CreateLeadInput>;
  errors: FieldErrors<CreateLeadInput>;
  setValue: UseFormSetValue<CreateLeadInput>;
  watch: UseFormWatch<CreateLeadInput>;
}

export function AddressStep({ errors, setValue, watch }: AddressStepProps) {
  const [addressValue, setAddressValue] = useState(watch('address') || '');

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    setValue('address', suggestion.placeName, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setAddressValue(suggestion.placeName);
  };
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
          <AddressAutocomplete
            value={addressValue}
            onChange={(value) => {
              setAddressValue(value);
              setValue('address', value, { shouldValidate: true });
            }}
            onSelect={handleAddressSelect}
            error={errors.address?.message}
            placeholder="123 Main St, San Antonio, TX 78201"
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
