'use client';

import type {
  CreateLeadInput,
  PropertyCondition,
  PropertyFeature,
  PropertyType,
} from '@dealforge/types';
import { PROPERTY_FEATURES } from '@dealforge/types';
import { ChevronDown, Home } from 'lucide-react';
import { useState } from 'react';
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface PropertyStepProps {
  register: UseFormRegister<CreateLeadInput>;
  errors: FieldErrors<CreateLeadInput>;
  setValue: UseFormSetValue<CreateLeadInput>;
  watch: UseFormWatch<CreateLeadInput>;
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

export function PropertyStep({ register, errors, setValue, watch }: PropertyStepProps) {
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const selectedFeatures = watch('features') ?? [];

  const toggleFeature = (feature: PropertyFeature) => {
    const current = selectedFeatures;
    const newFeatures = current.includes(feature)
      ? current.filter((f) => f !== feature)
      : [...current, feature];
    setValue('features', newFeatures, { shouldValidate: true });
  };

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
            <Input id="homeSize" type="number" placeholder="e.g., 1200" {...register('homeSize')} />
          </div>

          {/* Bedrooms */}
          <div className="space-y-2">
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Input id="bedrooms" type="number" placeholder="e.g., 3" {...register('bedrooms')} />
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
            <Input id="lotCount" type="number" placeholder="e.g., 50" {...register('lotCount')} />
          </div>
        </div>

        {/* Additional Features - Collapsible */}
        <Collapsible open={featuresOpen} onOpenChange={setFeaturesOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full py-2">
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                featuresOpen && 'rotate-180'
              )}
            />
            Additional Features
            {selectedFeatures.length > 0 && (
              <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {selectedFeatures.length} selected
              </span>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PROPERTY_FEATURES.map((feature) => (
                <label
                  key={feature.value}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors',
                    selectedFeatures.includes(feature.value)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(feature.value)}
                    onChange={() => toggleFeature(feature.value)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">{feature.label}</span>
                </label>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
