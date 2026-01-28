'use client';

import type { CreateLeadInput, PropertyCondition, PropertyType } from '@dealforge/types';
import { Home } from 'lucide-react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PropertyStepProps {
  register: UseFormRegister<CreateLeadInput>;
  errors: FieldErrors<CreateLeadInput>;
}

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'singlewide', label: 'Singlewide' },
  { value: 'doublewide', label: 'Doublewide' },
  { value: 'land_only', label: 'Land Only' },
  { value: 'land_with_home', label: 'Land with Home' },
  { value: 'park', label: 'MH Park' },
  { value: 'other', label: 'Other' },
];

const PROPERTY_CONDITIONS: { value: PropertyCondition; label: string }[] = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'average', label: 'Average' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'needs_rehab', label: 'Needs Rehab' },
  { value: 'unknown', label: 'Unknown' },
];

export function PropertyStep({ register, errors }: PropertyStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Property Details
        </CardTitle>
        <CardDescription>
          Provide details about the property. All fields are optional.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Property Type */}
          <div className="space-y-2">
            <Label htmlFor="propertyType">Property Type</Label>
            <Select>
              <SelectTrigger id="propertyType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register('propertyType')} />
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <Label htmlFor="propertyCondition">Condition</Label>
            <Select>
              <SelectTrigger id="propertyCondition">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_CONDITIONS.map((condition) => (
                  <SelectItem key={condition.value} value={condition.value}>
                    {condition.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register('propertyCondition')} />
          </div>

          {/* Year Built */}
          <div className="space-y-2">
            <Label htmlFor="yearBuilt">Year Built</Label>
            <Input
              id="yearBuilt"
              type="number"
              placeholder="e.g., 1995"
              {...register('yearBuilt')}
            />
            {errors.yearBuilt?.message && (
              <p className="text-sm text-destructive">{errors.yearBuilt.message}</p>
            )}
          </div>

          {/* Lot Size */}
          <div className="space-y-2">
            <Label htmlFor="lotSize">Lot Size (acres)</Label>
            <Input
              id="lotSize"
              type="number"
              step="0.01"
              placeholder="e.g., 0.5"
              {...register('lotSize')}
            />
          </div>

          {/* Home Size */}
          <div className="space-y-2">
            <Label htmlFor="homeSize">Home Size (sq ft)</Label>
            <Input
              id="homeSize"
              type="number"
              placeholder="e.g., 1200"
              {...register('homeSize')}
            />
          </div>

          {/* Bedrooms */}
          <div className="space-y-2">
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Input
              id="bedrooms"
              type="number"
              placeholder="e.g., 3"
              {...register('bedrooms')}
            />
          </div>

          {/* Bathrooms */}
          <div className="space-y-2">
            <Label htmlFor="bathrooms">Bathrooms</Label>
            <Input
              id="bathrooms"
              type="number"
              step="0.5"
              placeholder="e.g., 2"
              {...register('bathrooms')}
            />
          </div>

          {/* Lot Count (for parks) */}
          <div className="space-y-2">
            <Label htmlFor="lotCount">Lot Count (for parks)</Label>
            <Input
              id="lotCount"
              type="number"
              placeholder="e.g., 50"
              {...register('lotCount')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
