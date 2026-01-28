'use client';

import type { CreateLeadInput, LeadSource } from '@dealforge/types';
import { FileText, User } from 'lucide-react';
import type { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';

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
import { Textarea } from '@/components/ui/textarea';

interface SellerStepProps {
  register: UseFormRegister<CreateLeadInput>;
  errors: FieldErrors<CreateLeadInput>;
  watch: UseFormWatch<CreateLeadInput>;
}

const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: 'direct_mail', label: 'Direct Mail' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'referral', label: 'Referral' },
  { value: 'zillow', label: 'Zillow' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'craigslist', label: 'Craigslist' },
  { value: 'wholesaler', label: 'Wholesaler' },
  { value: 'mls', label: 'MLS' },
  { value: 'driving_for_dollars', label: 'Driving for Dollars' },
  { value: 'ai_scout', label: 'AI Scout' },
  { value: 'other', label: 'Other' },
];

export function SellerStep({ register, errors }: SellerStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Seller Information
          </CardTitle>
          <CardDescription>
            Contact information for the seller. All fields are optional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Seller Name */}
            <div className="space-y-2">
              <Label htmlFor="sellerName">Seller Name</Label>
              <Input id="sellerName" placeholder="John Doe" {...register('sellerName')} />
            </div>

            {/* Seller Phone */}
            <div className="space-y-2">
              <Label htmlFor="sellerPhone">Phone Number</Label>
              <Input
                id="sellerPhone"
                type="tel"
                placeholder="(555) 123-4567"
                {...register('sellerPhone')}
              />
            </div>

            {/* Seller Email */}
            <div className="space-y-2">
              <Label htmlFor="sellerEmail">Email</Label>
              <Input
                id="sellerEmail"
                type="email"
                placeholder="seller@example.com"
                {...register('sellerEmail')}
              />
              {errors.sellerEmail?.message && (
                <p className="text-sm text-destructive">{errors.sellerEmail.message}</p>
              )}
            </div>

            {/* Lead Source */}
            <div className="space-y-2">
              <Label htmlFor="leadSource">Lead Source</Label>
              <Select>
                <SelectTrigger id="leadSource">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" {...register('leadSource')} />
            </div>
          </div>

          {/* Seller Motivation */}
          <div className="space-y-2">
            <Label htmlFor="sellerMotivation">Seller Motivation</Label>
            <Textarea
              id="sellerMotivation"
              placeholder="Why are they selling? Any time pressure or motivation factors..."
              rows={3}
              {...register('sellerMotivation')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes
          </CardTitle>
          <CardDescription>Any additional notes or observations about this lead.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            placeholder="Additional notes, observations, or reminders..."
            rows={4}
            {...register('notes')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
