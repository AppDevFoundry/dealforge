# Epic 1: Lead Intelligence & Due Diligence Reports
## Detailed Implementation Plan

**Version:** 1.0
**Date:** January 2026
**Status:** Ready for Implementation

---

## Overview

This document provides a comprehensive implementation plan for the Lead Intelligence & Due Diligence Reports feature. This is designed to be handed off to a coding agent for implementation.

### Business Context

Users (including TDHCA-licensed Retailer/Broker/Installers and other investors) receive property leads for mobile homes and land from various sources. They need to quickly assess deal viability by gathering intelligence from multiple sources. Currently this is manual and time-consuming.

### Example Lead

```
Address: 122 County Rd. 3052, Orange Grove, TX 78372
Year Built: 2014
Bedrooms: 2, Bathrooms: 2
Type: Singlewide
Condition: Average (water damage noted)
Asking: $115,000
Mortgage Balance: $116,000 (underwater)
Acreage: 2 acres
Extras: RV carport with hookups, storage building, gazebo
Seller Motivation: Property issues, wants to sell now
```

### Desired Outcome

User enters lead details → System gathers all available intelligence → AI analyzes the deal → Professional PDF report is generated.

---

## Technical Architecture

### Current Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TailwindCSS, shadcn/ui
- **Backend:** Next.js API routes, Vercel AI SDK
- **Database:** PostgreSQL (Neon) with PostGIS, Drizzle ORM
- **AI:** OpenAI GPT-4 via Vercel AI SDK
- **Maps:** Mapbox GL JS
- **Monorepo:** Turborepo with pnpm

### New Components to Build

```
apps/web/
├── app/
│   └── (dashboard)/
│       └── leads/
│           ├── page.tsx                    # Lead list/dashboard
│           ├── new/
│           │   └── page.tsx                # New lead intake form
│           └── [leadId]/
│               ├── page.tsx                # Lead detail view
│               └── report/
│                   └── page.tsx            # Report view/download
├── components/
│   └── leads/
│       ├── lead-intake-form.tsx            # Multi-step form
│       ├── lead-card.tsx                   # Card for list view
│       ├── lead-intelligence-panel.tsx     # Intelligence display
│       ├── lead-map-view.tsx               # Map with lead location
│       └── report-preview.tsx              # Report preview component
├── lib/
│   ├── ai/
│   │   └── tools/
│   │       └── analyze-property-lead.ts    # New AI tool
│   ├── leads/
│   │   ├── types.ts                        # Lead types/interfaces
│   │   ├── actions.ts                      # Server actions
│   │   └── intelligence.ts                 # Intelligence gathering
│   └── reports/
│       ├── generator.ts                    # Report generation logic
│       └── templates/
│           └── due-diligence.tsx           # React PDF template

packages/database/
└── src/
    └── schema/
        └── leads.ts                        # New schema file
```

---

## Database Schema

### New Tables

Create a new schema file: `packages/database/src/schema/leads.ts`

```typescript
import { index, integer, jsonb, pgEnum, pgTable, real, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users';

/**
 * Lead status enum
 */
export const leadStatusEnum = pgEnum('lead_status', [
  'new',           // Just submitted, not yet analyzed
  'analyzing',     // Intelligence gathering in progress
  'analyzed',      // Analysis complete
  'interested',    // User marked as interested
  'passed',        // User passed on this lead
  'in_progress',   // Deal in progress
  'closed',        // Deal closed
  'dead',          // Deal fell through
]);

/**
 * Property type enum
 */
export const propertyTypeEnum = pgEnum('property_type', [
  'singlewide',
  'doublewide',
  'land_only',
  'land_with_home',
  'park',          // MH park/community
  'other',
]);

/**
 * Property condition enum
 */
export const propertyConditionEnum = pgEnum('property_condition', [
  'excellent',
  'good',
  'average',
  'fair',
  'poor',
  'needs_rehab',
  'unknown',
]);

/**
 * Leads table - stores property leads submitted by users
 */
export const leads = pgTable(
  'leads',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `lead_${createId()}`),

    // Owner
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Status
    status: leadStatusEnum('status').notNull().default('new'),

    // Property Address
    addressRaw: text('address_raw').notNull(),          // Original input
    addressFormatted: text('address_formatted'),         // Geocoded/formatted
    city: text('city'),
    county: text('county'),
    state: text('state').default('TX'),
    zipCode: text('zip_code'),
    latitude: real('latitude'),
    longitude: real('longitude'),

    // Property Details (user-provided)
    propertyType: propertyTypeEnum('property_type'),
    yearBuilt: integer('year_built'),
    bedrooms: integer('bedrooms'),
    bathrooms: real('bathrooms'),                        // Allow 1.5, 2.5, etc.
    squareFeet: integer('square_feet'),
    acreage: real('acreage'),
    condition: propertyConditionEnum('condition'),
    conditionNotes: text('condition_notes'),             // "water damage", etc.

    // Financial Details (user-provided)
    askingPrice: integer('asking_price'),
    mortgageBalance: integer('mortgage_balance'),
    taxesOwed: integer('taxes_owed'),
    estimatedRepairs: integer('estimated_repairs'),

    // Seller Info
    sellerName: text('seller_name'),
    sellerPhone: text('seller_phone'),
    sellerEmail: text('seller_email'),
    sellerMotivation: text('seller_motivation'),         // "relocating", "foreclosure", etc.
    sellerTimeframe: text('seller_timeframe'),           // "ASAP", "30 days", etc.
    leadSource: text('lead_source'),                     // "Google", "referral", etc.

    // Additional Property Features (user-provided)
    features: jsonb('features').$type<{
      hasRvHookups?: boolean;
      hasStorageBuilding?: boolean;
      hasGarage?: boolean;
      hasCarport?: boolean;
      hasSeptic?: boolean;
      hasWell?: boolean;
      hasCentralAc?: boolean;
      isOccupied?: boolean;
      needsToBeMoved?: boolean;
      other?: string[];
    }>(),

    // Notes
    notes: text('notes'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    analyzedAt: timestamp('analyzed_at', { withTimezone: true }),
  },
  (table) => [
    index('leads_user_id_idx').on(table.userId),
    index('leads_status_idx').on(table.status),
    index('leads_county_idx').on(table.county),
    index('leads_created_at_idx').on(table.createdAt),
  ]
);

/**
 * Lead Intelligence - stores gathered intelligence for a lead
 */
export const leadIntelligence = pgTable(
  'lead_intelligence',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `lint_${createId()}`),

    leadId: text('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),

    // Utility Coverage (from CCN check)
    hasWaterCcn: text('has_water_ccn'),                  // 'yes', 'no', 'unknown'
    waterProvider: text('water_provider'),
    hasSewerCcn: text('has_sewer_ccn'),
    sewerProvider: text('sewer_provider'),

    // Flood Zone (from FEMA)
    floodZone: text('flood_zone'),                       // 'X', 'A', 'AE', etc.
    floodZoneDescription: text('flood_zone_description'),
    isHighRiskFlood: text('is_high_risk_flood'),         // 'yes', 'no'

    // Market Data
    fmrFiscalYear: integer('fmr_fiscal_year'),
    fmrTwoBedroom: integer('fmr_two_bedroom'),
    suggestedLotRentLow: integer('suggested_lot_rent_low'),
    suggestedLotRentHigh: integer('suggested_lot_rent_high'),

    // Demographics
    medianHouseholdIncome: integer('median_household_income'),
    unemploymentRate: real('unemployment_rate'),
    populationGrowthRate: real('population_growth_rate'),
    mobileHomesPercent: real('mobile_homes_percent'),

    // Nearby Parks
    nearbyParksCount: integer('nearby_parks_count'),
    nearbyParksData: jsonb('nearby_parks_data').$type<Array<{
      id: string;
      name: string;
      distance: number;
      lotCount: number | null;
      distressScore: number | null;
    }>>(),

    // TDHCA Records (if property is in database)
    tdhcaRecordId: text('tdhca_record_id'),
    tdhcaOwnerName: text('tdhca_owner_name'),
    tdhcaManufacturer: text('tdhca_manufacturer'),
    tdhcaModelYear: integer('tdhca_model_year'),
    tdhcaHasLiens: text('tdhca_has_liens'),
    tdhcaTotalLienAmount: integer('tdhca_total_lien_amount'),

    // Parcel Data (when available)
    parcelId: text('parcel_id'),
    parcelOwner: text('parcel_owner'),
    parcelAcreage: real('parcel_acreage'),
    parcelAssessedValue: integer('parcel_assessed_value'),

    // AI Analysis
    aiInsights: jsonb('ai_insights').$type<string[]>(),
    aiRiskFactors: jsonb('ai_risk_factors').$type<string[]>(),
    aiOpportunities: jsonb('ai_opportunities').$type<string[]>(),
    aiRecommendation: text('ai_recommendation'),         // 'pursue', 'pass', 'needs_more_info'
    aiConfidenceScore: real('ai_confidence_score'),      // 0-100

    // Raw API responses (for debugging/audit)
    rawResponses: jsonb('raw_responses'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('lead_intelligence_lead_id_idx').on(table.leadId),
  ]
);

/**
 * Lead Reports - stores generated PDF reports
 */
export const leadReports = pgTable(
  'lead_reports',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `rpt_${createId()}`),

    leadId: text('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),

    // Report metadata
    reportType: text('report_type').notNull().default('due_diligence'),
    version: integer('version').notNull().default(1),

    // Storage
    fileUrl: text('file_url'),                           // URL to stored PDF
    fileName: text('file_name'),
    fileSizeBytes: integer('file_size_bytes'),

    // Generation tracking
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
    generatedBy: text('generated_by'),                   // 'system' or user ID

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('lead_reports_lead_id_idx').on(table.leadId),
  ]
);

// Type exports
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type LeadIntelligence = typeof leadIntelligence.$inferSelect;
export type NewLeadIntelligence = typeof leadIntelligence.$inferInsert;
export type LeadReport = typeof leadReports.$inferSelect;
export type NewLeadReport = typeof leadReports.$inferInsert;
```

### Migration

After creating the schema, run:

```bash
cd packages/database
pnpm db:generate
pnpm db:push
```

---

## Implementation Stories

### Story 1: Lead Database Schema & Types

**Acceptance Criteria:**
- [ ] Schema file created at `packages/database/src/schema/leads.ts`
- [ ] Schema exported from `packages/database/src/schema/index.ts`
- [ ] Migration generated and applied
- [ ] Types exported and usable in web app

**Implementation Notes:**
- Use the schema provided above
- Ensure proper foreign key relationships
- Add indexes for common query patterns

---

### Story 2: Lead Intake Form

**Acceptance Criteria:**
- [ ] Multi-step form at `/leads/new`
- [ ] Step 1: Property Address (required)
- [ ] Step 2: Property Details (type, beds, baths, year, condition)
- [ ] Step 3: Financial Details (asking price, mortgage, repairs)
- [ ] Step 4: Seller Information (optional)
- [ ] Step 5: Additional Notes/Features
- [ ] Form validates and saves to database
- [ ] After submit, redirects to lead detail page

**UI/UX Requirements:**
- Use shadcn/ui form components
- Progress indicator showing current step
- "Back" and "Next" navigation
- "Save Draft" option
- Mobile-responsive design

**Implementation:**

Create `apps/web/components/leads/lead-intake-form.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { createLead } from '@/lib/leads/actions';

// Form schema
const leadFormSchema = z.object({
  // Step 1: Address
  addressRaw: z.string().min(5, 'Please enter a valid address'),

  // Step 2: Property Details
  propertyType: z.enum(['singlewide', 'doublewide', 'land_only', 'land_with_home', 'park', 'other']).optional(),
  yearBuilt: z.number().min(1900).max(2030).optional(),
  bedrooms: z.number().min(0).max(10).optional(),
  bathrooms: z.number().min(0).max(10).optional(),
  squareFeet: z.number().min(0).optional(),
  acreage: z.number().min(0).optional(),
  condition: z.enum(['excellent', 'good', 'average', 'fair', 'poor', 'needs_rehab', 'unknown']).optional(),
  conditionNotes: z.string().optional(),

  // Step 3: Financial
  askingPrice: z.number().min(0).optional(),
  mortgageBalance: z.number().min(0).optional(),
  taxesOwed: z.number().min(0).optional(),
  estimatedRepairs: z.number().min(0).optional(),

  // Step 4: Seller Info
  sellerName: z.string().optional(),
  sellerPhone: z.string().optional(),
  sellerEmail: z.string().email().optional().or(z.literal('')),
  sellerMotivation: z.string().optional(),
  sellerTimeframe: z.string().optional(),
  leadSource: z.string().optional(),

  // Step 5: Features & Notes
  features: z.object({
    hasRvHookups: z.boolean().optional(),
    hasStorageBuilding: z.boolean().optional(),
    hasGarage: z.boolean().optional(),
    hasCarport: z.boolean().optional(),
    hasSeptic: z.boolean().optional(),
    hasWell: z.boolean().optional(),
    hasCentralAc: z.boolean().optional(),
    isOccupied: z.boolean().optional(),
    needsToBeMoved: z.boolean().optional(),
  }).optional(),
  notes: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

const STEPS = [
  { id: 1, title: 'Property Address', description: 'Where is the property located?' },
  { id: 2, title: 'Property Details', description: 'Tell us about the property' },
  { id: 3, title: 'Financial Details', description: 'Pricing and financial information' },
  { id: 4, title: 'Seller Information', description: 'Optional seller details' },
  { id: 5, title: 'Additional Info', description: 'Features and notes' },
];

export function LeadIntakeForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      features: {},
    },
  });

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createLead(data);
      if (result.success && result.leadId) {
        router.push(`/leads/${result.leadId}`);
      }
    } catch (error) {
      console.error('Failed to create lead:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex-1 text-center ${
                step.id === currentStep
                  ? 'text-primary font-medium'
                  : step.id < currentStep
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/50'
              }`}
            >
              <div
                className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  step.id === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : step.id < currentStep
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted'
                }`}
              >
                {step.id}
              </div>
              <span className="text-xs hidden sm:block">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep - 1]?.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {STEPS[currentStep - 1]?.description}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Render step content based on currentStep */}
            {currentStep === 1 && (
              <StepAddress form={form} />
            )}
            {currentStep === 2 && (
              <StepPropertyDetails form={form} />
            )}
            {currentStep === 3 && (
              <StepFinancial form={form} />
            )}
            {currentStep === 4 && (
              <StepSeller form={form} />
            )}
            {currentStep === 5 && (
              <StepFeatures form={form} />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Back
          </Button>

          {currentStep < STEPS.length ? (
            <Button type="button" onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Analyzing...' : 'Submit & Analyze'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

// Step components (implement each)
function StepAddress({ form }: { form: any }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="addressRaw">Property Address *</Label>
        <Input
          id="addressRaw"
          placeholder="123 County Rd 3052, Orange Grove, TX 78372"
          {...form.register('addressRaw')}
        />
        {form.formState.errors.addressRaw && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.addressRaw.message}
          </p>
        )}
      </div>
    </div>
  );
}

function StepPropertyDetails({ form }: { form: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="propertyType">Property Type</Label>
          <Select
            onValueChange={(value) => form.setValue('propertyType', value)}
            defaultValue={form.getValues('propertyType')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="singlewide">Singlewide</SelectItem>
              <SelectItem value="doublewide">Doublewide</SelectItem>
              <SelectItem value="land_only">Land Only</SelectItem>
              <SelectItem value="land_with_home">Land with Home</SelectItem>
              <SelectItem value="park">MH Park</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="yearBuilt">Year Built</Label>
          <Input
            id="yearBuilt"
            type="number"
            placeholder="2014"
            {...form.register('yearBuilt', { valueAsNumber: true })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input
            id="bedrooms"
            type="number"
            {...form.register('bedrooms', { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input
            id="bathrooms"
            type="number"
            step="0.5"
            {...form.register('bathrooms', { valueAsNumber: true })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="squareFeet">Square Feet</Label>
          <Input
            id="squareFeet"
            type="number"
            {...form.register('squareFeet', { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label htmlFor="acreage">Acreage</Label>
          <Input
            id="acreage"
            type="number"
            step="0.01"
            placeholder="2.0"
            {...form.register('acreage', { valueAsNumber: true })}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="condition">Condition</Label>
        <Select
          onValueChange={(value) => form.setValue('condition', value)}
          defaultValue={form.getValues('condition')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="excellent">Excellent</SelectItem>
            <SelectItem value="good">Good</SelectItem>
            <SelectItem value="average">Average</SelectItem>
            <SelectItem value="fair">Fair</SelectItem>
            <SelectItem value="poor">Poor</SelectItem>
            <SelectItem value="needs_rehab">Needs Rehab</SelectItem>
            <SelectItem value="unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="conditionNotes">Condition Notes</Label>
        <Textarea
          id="conditionNotes"
          placeholder="Water damage, missing flooring, etc."
          {...form.register('conditionNotes')}
        />
      </div>
    </div>
  );
}

function StepFinancial({ form }: { form: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="askingPrice">Asking Price ($)</Label>
          <Input
            id="askingPrice"
            type="number"
            placeholder="115000"
            {...form.register('askingPrice', { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label htmlFor="mortgageBalance">Mortgage Balance ($)</Label>
          <Input
            id="mortgageBalance"
            type="number"
            placeholder="116000"
            {...form.register('mortgageBalance', { valueAsNumber: true })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="taxesOwed">Taxes Owed ($)</Label>
          <Input
            id="taxesOwed"
            type="number"
            {...form.register('taxesOwed', { valueAsNumber: true })}
          />
        </div>
        <div>
          <Label htmlFor="estimatedRepairs">Estimated Repairs ($)</Label>
          <Input
            id="estimatedRepairs"
            type="number"
            {...form.register('estimatedRepairs', { valueAsNumber: true })}
          />
        </div>
      </div>
    </div>
  );
}

function StepSeller({ form }: { form: any }) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="sellerName">Seller Name</Label>
        <Input
          id="sellerName"
          {...form.register('sellerName')}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sellerPhone">Phone</Label>
          <Input
            id="sellerPhone"
            type="tel"
            {...form.register('sellerPhone')}
          />
        </div>
        <div>
          <Label htmlFor="sellerEmail">Email</Label>
          <Input
            id="sellerEmail"
            type="email"
            {...form.register('sellerEmail')}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="sellerMotivation">Motivation</Label>
        <Select
          onValueChange={(value) => form.setValue('sellerMotivation', value)}
          defaultValue={form.getValues('sellerMotivation')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Why are they selling?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relocating">Relocating</SelectItem>
            <SelectItem value="financial">Financial Difficulties</SelectItem>
            <SelectItem value="property_issues">Property Issues</SelectItem>
            <SelectItem value="divorce">Divorce</SelectItem>
            <SelectItem value="inheritance">Inherited Property</SelectItem>
            <SelectItem value="upgrading">Upgrading</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="sellerTimeframe">Timeframe</Label>
        <Select
          onValueChange={(value) => form.setValue('sellerTimeframe', value)}
          defaultValue={form.getValues('sellerTimeframe')}
        >
          <SelectTrigger>
            <SelectValue placeholder="How soon?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asap">ASAP</SelectItem>
            <SelectItem value="30_days">Within 30 days</SelectItem>
            <SelectItem value="60_days">Within 60 days</SelectItem>
            <SelectItem value="90_days">Within 90 days</SelectItem>
            <SelectItem value="flexible">Flexible</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="leadSource">Lead Source</Label>
        <Input
          id="leadSource"
          placeholder="Google, Referral, etc."
          {...form.register('leadSource')}
        />
      </div>
    </div>
  );
}

function StepFeatures({ form }: { form: any }) {
  const features = [
    { id: 'hasRvHookups', label: 'RV Hookups' },
    { id: 'hasStorageBuilding', label: 'Storage Building' },
    { id: 'hasGarage', label: 'Garage' },
    { id: 'hasCarport', label: 'Carport' },
    { id: 'hasSeptic', label: 'Septic System' },
    { id: 'hasWell', label: 'Well Water' },
    { id: 'hasCentralAc', label: 'Central A/C' },
    { id: 'isOccupied', label: 'Currently Occupied' },
    { id: 'needsToBeMoved', label: 'Needs to be Moved' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-3 block">Property Features</Label>
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature) => (
            <div key={feature.id} className="flex items-center space-x-2">
              <Checkbox
                id={feature.id}
                checked={form.watch(`features.${feature.id}`)}
                onCheckedChange={(checked) =>
                  form.setValue(`features.${feature.id}`, checked)
                }
              />
              <Label htmlFor={feature.id} className="font-normal">
                {feature.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          placeholder="Any other important information about this lead..."
          rows={4}
          {...form.register('notes')}
        />
      </div>
    </div>
  );
}
```

---

### Story 3: Lead Server Actions

**Acceptance Criteria:**
- [ ] `createLead` action saves lead to database
- [ ] `getLead` action retrieves lead with intelligence
- [ ] `updateLead` action updates lead details
- [ ] `deleteLead` action removes lead
- [ ] `listLeads` action returns paginated leads for user

**Implementation:**

Create `apps/web/lib/leads/actions.ts`:

```typescript
'use server';

import { db } from '@workspace/database';
import { leads, leadIntelligence, leadReports, eq, desc, and } from '@workspace/database';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { gatherLeadIntelligence } from './intelligence';

export async function createLead(data: {
  addressRaw: string;
  propertyType?: string;
  yearBuilt?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  acreage?: number;
  condition?: string;
  conditionNotes?: string;
  askingPrice?: number;
  mortgageBalance?: number;
  taxesOwed?: number;
  estimatedRepairs?: number;
  sellerName?: string;
  sellerPhone?: string;
  sellerEmail?: string;
  sellerMotivation?: string;
  sellerTimeframe?: string;
  leadSource?: string;
  features?: Record<string, boolean>;
  notes?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    // Create the lead
    const [lead] = await db
      .insert(leads)
      .values({
        userId: session.user.id,
        status: 'analyzing',
        addressRaw: data.addressRaw,
        propertyType: data.propertyType as any,
        yearBuilt: data.yearBuilt,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        squareFeet: data.squareFeet,
        acreage: data.acreage,
        condition: data.condition as any,
        conditionNotes: data.conditionNotes,
        askingPrice: data.askingPrice,
        mortgageBalance: data.mortgageBalance,
        taxesOwed: data.taxesOwed,
        estimatedRepairs: data.estimatedRepairs,
        sellerName: data.sellerName,
        sellerPhone: data.sellerPhone,
        sellerEmail: data.sellerEmail,
        sellerMotivation: data.sellerMotivation,
        sellerTimeframe: data.sellerTimeframe,
        leadSource: data.leadSource,
        features: data.features,
        notes: data.notes,
      })
      .returning();

    // Trigger intelligence gathering (async)
    gatherLeadIntelligence(lead!.id).catch(console.error);

    revalidatePath('/leads');
    return { success: true, leadId: lead!.id };
  } catch (error) {
    console.error('Failed to create lead:', error);
    return { success: false, error: 'Failed to create lead' };
  }
}

export async function getLead(leadId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.userId, session.user.id)));

  if (!lead) return null;

  const [intelligence] = await db
    .select()
    .from(leadIntelligence)
    .where(eq(leadIntelligence.leadId, leadId));

  const reports = await db
    .select()
    .from(leadReports)
    .where(eq(leadReports.leadId, leadId))
    .orderBy(desc(leadReports.createdAt));

  return {
    ...lead,
    intelligence,
    reports,
  };
}

export async function listLeads(options?: {
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { leads: [], total: 0 };
  }

  const conditions = [eq(leads.userId, session.user.id)];

  if (options?.status) {
    conditions.push(eq(leads.status, options.status as any));
  }

  const result = await db
    .select()
    .from(leads)
    .where(and(...conditions))
    .orderBy(desc(leads.createdAt))
    .limit(options?.limit ?? 20)
    .offset(options?.offset ?? 0);

  return { leads: result, total: result.length };
}

export async function updateLeadStatus(leadId: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  await db
    .update(leads)
    .set({ status: status as any, updatedAt: new Date() })
    .where(and(eq(leads.id, leadId), eq(leads.userId, session.user.id)));

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
  return { success: true };
}
```

---

### Story 4: Intelligence Gathering Service

**Acceptance Criteria:**
- [ ] Geocodes address using Mapbox
- [ ] Checks CCN water/sewer coverage
- [ ] Checks flood zone (placeholder - FEMA integration future)
- [ ] Fetches market data (FMR, demographics)
- [ ] Finds nearby MH parks
- [ ] Searches TDHCA records for property
- [ ] Runs AI analysis for insights
- [ ] Stores all gathered data in lead_intelligence table
- [ ] Updates lead status to 'analyzed' when complete

**Implementation:**

Create `apps/web/lib/leads/intelligence.ts`:

```typescript
import { db } from '@workspace/database';
import { leads, leadIntelligence, eq } from '@workspace/database';
import { neon } from '@neondatabase/serverless';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

export async function gatherLeadIntelligence(leadId: string): Promise<void> {
  const sql = getSql();

  // Get the lead
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
  if (!lead) {
    throw new Error('Lead not found');
  }

  const intelligence: Record<string, any> = {};

  try {
    // Step 1: Geocode the address
    const geocoded = await geocodeAddress(lead.addressRaw);
    if (geocoded) {
      // Update lead with geocoded data
      await db
        .update(leads)
        .set({
          addressFormatted: geocoded.formattedAddress,
          city: geocoded.city,
          county: geocoded.county,
          zipCode: geocoded.zipCode,
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, leadId));

      intelligence.latitude = geocoded.latitude;
      intelligence.longitude = geocoded.longitude;
    }

    // Step 2: Check CCN coverage (if we have coordinates)
    if (geocoded?.latitude && geocoded?.longitude) {
      const ccn = await checkCCNCoverage(sql, geocoded.latitude, geocoded.longitude);
      intelligence.hasWaterCcn = ccn.hasWater ? 'yes' : 'no';
      intelligence.waterProvider = ccn.waterProvider;
      intelligence.hasSewerCcn = ccn.hasSewer ? 'yes' : 'no';
      intelligence.sewerProvider = ccn.sewerProvider;
    }

    // Step 3: Check flood zone (placeholder - implement with FEMA API later)
    intelligence.floodZone = 'unknown';
    intelligence.floodZoneDescription = 'Flood zone check not yet implemented';
    intelligence.isHighRiskFlood = 'unknown';

    // Step 4: Get market data
    if (geocoded?.zipCode) {
      const marketData = await getMarketData(sql, geocoded.zipCode, geocoded.county);
      Object.assign(intelligence, marketData);
    }

    // Step 5: Find nearby parks
    if (geocoded?.latitude && geocoded?.longitude) {
      const nearbyParks = await findNearbyParks(sql, geocoded.latitude, geocoded.longitude);
      intelligence.nearbyParksCount = nearbyParks.length;
      intelligence.nearbyParksData = nearbyParks;
    }

    // Step 6: Search TDHCA records
    const tdhcaData = await searchTDHCA(sql, lead.addressRaw, geocoded?.county);
    if (tdhcaData) {
      Object.assign(intelligence, tdhcaData);
    }

    // Step 7: Run AI analysis
    const aiAnalysis = await runAIAnalysis(lead, intelligence);
    intelligence.aiInsights = aiAnalysis.insights;
    intelligence.aiRiskFactors = aiAnalysis.riskFactors;
    intelligence.aiOpportunities = aiAnalysis.opportunities;
    intelligence.aiRecommendation = aiAnalysis.recommendation;
    intelligence.aiConfidenceScore = aiAnalysis.confidenceScore;

    // Save intelligence to database
    await db.insert(leadIntelligence).values({
      leadId,
      ...intelligence,
    });

    // Update lead status
    await db
      .update(leads)
      .set({
        status: 'analyzed',
        analyzedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId));
  } catch (error) {
    console.error('Intelligence gathering failed:', error);

    // Update lead status to indicate partial analysis
    await db
      .update(leads)
      .set({
        status: 'analyzed', // Still mark as analyzed with partial data
        analyzedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId));

    // Save whatever intelligence we gathered
    if (Object.keys(intelligence).length > 0) {
      await db.insert(leadIntelligence).values({
        leadId,
        ...intelligence,
      });
    }
  }
}

async function geocodeAddress(address: string) {
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
  if (!mapboxToken) {
    console.warn('MAPBOX_ACCESS_TOKEN not set');
    return null;
  }

  const encodedAddress = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&country=US&types=address&limit=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.features || data.features.length === 0) return null;

    const feature = data.features[0];
    const [longitude, latitude] = feature.center;

    let zipCode = '';
    let county = '';
    let city = '';

    for (const ctx of feature.context || []) {
      if (ctx.id.startsWith('postcode')) zipCode = ctx.text;
      else if (ctx.id.startsWith('district')) county = ctx.text.replace(' County', '');
      else if (ctx.id.startsWith('place')) city = ctx.text;
    }

    return {
      latitude,
      longitude,
      formattedAddress: feature.place_name,
      zipCode,
      county,
      city,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

async function checkCCNCoverage(sql: any, latitude: number, longitude: number) {
  const result = { hasWater: false, hasSewer: false, waterProvider: '', sewerProvider: '' };

  try {
    const waterCoverage = await sql`
      SELECT utility_name FROM ccn_areas
      WHERE service_type IN ('water', 'both')
        AND ST_Contains(boundary::geometry, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
      LIMIT 1
    `;
    if (waterCoverage.length > 0) {
      result.hasWater = true;
      result.waterProvider = waterCoverage[0].utility_name;
    }

    const sewerCoverage = await sql`
      SELECT utility_name FROM ccn_areas
      WHERE service_type IN ('sewer', 'both')
        AND ST_Contains(boundary::geometry, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
      LIMIT 1
    `;
    if (sewerCoverage.length > 0) {
      result.hasSewer = true;
      result.sewerProvider = sewerCoverage[0].utility_name;
    }
  } catch (error) {
    console.warn('CCN check failed:', error);
  }

  return result;
}

async function getMarketData(sql: any, zipCode: string, county?: string) {
  const data: Record<string, any> = {};

  // Get FMR
  const fmr = await sql`
    SELECT fiscal_year, two_bedroom
    FROM hud_fair_market_rents
    WHERE zip_code = ${zipCode}
    ORDER BY fiscal_year DESC
    LIMIT 1
  `;
  if (fmr.length > 0) {
    const twoBedroom = Number(fmr[0].two_bedroom) || 0;
    data.fmrFiscalYear = fmr[0].fiscal_year;
    data.fmrTwoBedroom = twoBedroom;
    data.suggestedLotRentLow = Math.round(twoBedroom * 0.3);
    data.suggestedLotRentHigh = Math.round(twoBedroom * 0.4);
  }

  // Get demographics (by county)
  if (county) {
    const demographics = await sql`
      SELECT
        median_household_income,
        mobile_homes_percent,
        population_growth_rate
      FROM census_demographics
      WHERE geo_name ILIKE ${`%${county}%`}
        AND geo_type = 'county'
      ORDER BY survey_year DESC
      LIMIT 1
    `;
    if (demographics.length > 0) {
      data.medianHouseholdIncome = demographics[0].median_household_income;
      data.mobileHomesPercent = demographics[0].mobile_homes_percent;
      data.populationGrowthRate = demographics[0].population_growth_rate;
    }

    // Get unemployment
    const employment = await sql`
      SELECT unemployment_rate
      FROM bls_employment
      WHERE area_name ILIKE ${`%${county}%`}
      ORDER BY year DESC, month DESC
      LIMIT 1
    `;
    if (employment.length > 0) {
      data.unemploymentRate = employment[0].unemployment_rate;
    }
  }

  return data;
}

async function findNearbyParks(sql: any, latitude: number, longitude: number) {
  const radiusMeters = 10 * 1609.34; // 10 miles

  const parks = await sql`
    SELECT
      id, name,
      ST_Distance(
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
      ) / 1609.34 as distance,
      lot_count,
      distress_score
    FROM mh_communities
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
        ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
        ${radiusMeters}
      )
    ORDER BY distance
    LIMIT 10
  `;

  return parks.map((p: any) => ({
    id: p.id,
    name: p.name,
    distance: Math.round(p.distance * 10) / 10,
    lotCount: p.lot_count,
    distressScore: p.distress_score,
  }));
}

async function searchTDHCA(sql: any, address: string, county?: string) {
  // Try to find matching TDHCA records
  // This is a simplified search - could be improved with fuzzy matching
  const records = await sql`
    SELECT
      id, owner_name, manufacturer, model_year
    FROM mh_ownership_records
    WHERE location_address ILIKE ${`%${address.split(',')[0]}%`}
    LIMIT 1
  `;

  if (records.length === 0) return null;

  const record = records[0];

  // Check for liens
  const liens = await sql`
    SELECT SUM(lien_amount) as total
    FROM mh_tax_liens
    WHERE ownership_record_id = ${record.id}
  `;

  return {
    tdhcaRecordId: record.id,
    tdhcaOwnerName: record.owner_name,
    tdhcaManufacturer: record.manufacturer,
    tdhcaModelYear: record.model_year,
    tdhcaHasLiens: liens[0]?.total ? 'yes' : 'no',
    tdhcaTotalLienAmount: liens[0]?.total || 0,
  };
}

async function runAIAnalysis(lead: any, intelligence: any) {
  const prompt = `
You are a real estate investment analyst specializing in mobile home deals in Texas.

Analyze this property lead and provide insights:

PROPERTY DETAILS:
- Address: ${lead.addressRaw}
- Type: ${lead.propertyType || 'Unknown'}
- Year Built: ${lead.yearBuilt || 'Unknown'}
- Bedrooms/Bathrooms: ${lead.bedrooms || '?'}/${lead.bathrooms || '?'}
- Condition: ${lead.condition || 'Unknown'} - ${lead.conditionNotes || 'No notes'}
- Acreage: ${lead.acreage || 'Unknown'}

FINANCIAL:
- Asking Price: $${lead.askingPrice?.toLocaleString() || 'Unknown'}
- Mortgage Balance: $${lead.mortgageBalance?.toLocaleString() || 'Unknown'}
- Estimated Repairs: $${lead.estimatedRepairs?.toLocaleString() || 'Unknown'}

SELLER:
- Motivation: ${lead.sellerMotivation || 'Unknown'}
- Timeframe: ${lead.sellerTimeframe || 'Unknown'}

INTELLIGENCE GATHERED:
- Water CCN: ${intelligence.hasWaterCcn || 'Unknown'} (${intelligence.waterProvider || 'N/A'})
- Sewer CCN: ${intelligence.hasSewerCcn || 'Unknown'} (${intelligence.sewerProvider || 'N/A'})
- FMR 2BR: $${intelligence.fmrTwoBedroom || 'Unknown'}
- Suggested Lot Rent: $${intelligence.suggestedLotRentLow}-$${intelligence.suggestedLotRentHigh || 'Unknown'}
- Median HH Income: $${intelligence.medianHouseholdIncome?.toLocaleString() || 'Unknown'}
- Unemployment: ${intelligence.unemploymentRate || 'Unknown'}%
- Nearby MH Parks: ${intelligence.nearbyParksCount || 0}
- TDHCA Liens: ${intelligence.tdhcaHasLiens || 'Unknown'}

Provide your analysis in this JSON format:
{
  "insights": ["insight 1", "insight 2", ...],
  "riskFactors": ["risk 1", "risk 2", ...],
  "opportunities": ["opportunity 1", "opportunity 2", ...],
  "recommendation": "pursue" | "pass" | "needs_more_info",
  "confidenceScore": 0-100
}

Be specific and actionable. Consider 21st Century Mortgage requirements for land/home deals.
`;

  try {
    const { text } = await generateText({
      model: openai('gpt-4o'),
      prompt,
    });

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('AI analysis failed:', error);
  }

  // Default response if AI fails
  return {
    insights: ['Unable to complete AI analysis'],
    riskFactors: [],
    opportunities: [],
    recommendation: 'needs_more_info',
    confidenceScore: 0,
  };
}
```

---

### Story 5: Lead Detail Page

**Acceptance Criteria:**
- [ ] Page at `/leads/[leadId]` shows full lead details
- [ ] Displays property info, financial details, seller info
- [ ] Shows intelligence panel with all gathered data
- [ ] Shows AI insights, risks, opportunities
- [ ] Includes map view centered on property
- [ ] Shows nearby parks on map
- [ ] Actions: Mark interested, Pass, Generate Report
- [ ] Status indicator and timeline

**Implementation:**

Create `apps/web/app/(dashboard)/leads/[leadId]/page.tsx`

This should be a detailed page showing:
1. Header with address and status badge
2. Two-column layout:
   - Left: Property details, financial info, seller info
   - Right: Intelligence panel with all data
3. Map view below
4. AI Analysis section with insights
5. Actions bar at bottom

---

### Story 6: Lead List Dashboard

**Acceptance Criteria:**
- [ ] Page at `/leads` shows all user's leads
- [ ] Filterable by status
- [ ] Sortable by date, price, county
- [ ] Card view showing key info
- [ ] Quick actions (view, mark interested, pass)
- [ ] "New Lead" button prominently displayed

---

### Story 7: PDF Report Generator

**Acceptance Criteria:**
- [ ] Generates professional PDF report
- [ ] Includes all lead details and intelligence
- [ ] AI analysis section
- [ ] Map screenshot
- [ ] Comparable lot rents table
- [ ] Risk/opportunity summary
- [ ] DealForge branding
- [ ] Downloadable from lead detail page

**Implementation:**

Use `@react-pdf/renderer` for PDF generation:

```bash
pnpm add @react-pdf/renderer -w --filter @workspace/web
```

Create `apps/web/lib/reports/templates/due-diligence.tsx`:

```tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #1a365d',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#f0f4f8',
    padding: 8,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '40%',
    fontSize: 10,
    color: '#666',
  },
  value: {
    width: '60%',
    fontSize: 10,
  },
  insight: {
    fontSize: 10,
    marginBottom: 5,
    paddingLeft: 10,
  },
  riskBadge: {
    backgroundColor: '#fed7d7',
    color: '#c53030',
    padding: '2 6',
    fontSize: 9,
    borderRadius: 3,
    marginRight: 5,
    marginBottom: 5,
  },
  opportunityBadge: {
    backgroundColor: '#c6f6d5',
    color: '#276749',
    padding: '2 6',
    fontSize: 9,
    borderRadius: 3,
    marginRight: 5,
    marginBottom: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
  },
});

interface DueDiligenceReportProps {
  lead: any;
  intelligence: any;
  generatedAt: Date;
}

export function DueDiligenceReport({
  lead,
  intelligence,
  generatedAt,
}: DueDiligenceReportProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Property Due Diligence Report</Text>
          <Text style={styles.subtitle}>
            {lead.addressFormatted || lead.addressRaw}
          </Text>
          <Text style={styles.subtitle}>
            Generated: {generatedAt.toLocaleDateString()}
          </Text>
        </View>

        {/* Property Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Property Type:</Text>
            <Text style={styles.value}>{lead.propertyType || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Year Built:</Text>
            <Text style={styles.value}>{lead.yearBuilt || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Beds/Baths:</Text>
            <Text style={styles.value}>
              {lead.bedrooms || '?'} / {lead.bathrooms || '?'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Acreage:</Text>
            <Text style={styles.value}>{lead.acreage || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Condition:</Text>
            <Text style={styles.value}>
              {lead.condition || 'N/A'}
              {lead.conditionNotes ? ` - ${lead.conditionNotes}` : ''}
            </Text>
          </View>
        </View>

        {/* Financial Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Analysis</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Asking Price:</Text>
            <Text style={styles.value}>
              ${lead.askingPrice?.toLocaleString() || 'N/A'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mortgage Balance:</Text>
            <Text style={styles.value}>
              ${lead.mortgageBalance?.toLocaleString() || 'N/A'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Equity Position:</Text>
            <Text style={styles.value}>
              {lead.askingPrice && lead.mortgageBalance
                ? `$${(lead.askingPrice - lead.mortgageBalance).toLocaleString()} ${
                    lead.askingPrice < lead.mortgageBalance ? '(UNDERWATER)' : ''
                  }`
                : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Utility Coverage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utility Coverage</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Water CCN:</Text>
            <Text style={styles.value}>
              {intelligence?.hasWaterCcn === 'yes'
                ? `✓ ${intelligence.waterProvider}`
                : '✗ No coverage'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Sewer CCN:</Text>
            <Text style={styles.value}>
              {intelligence?.hasSewerCcn === 'yes'
                ? `✓ ${intelligence.sewerProvider}`
                : '✗ No coverage (septic likely)'}
            </Text>
          </View>
        </View>

        {/* Market Context */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Context</Text>
          <View style={styles.row}>
            <Text style={styles.label}>FMR 2BR (FY{intelligence?.fmrFiscalYear}):</Text>
            <Text style={styles.value}>
              ${intelligence?.fmrTwoBedroom?.toLocaleString() || 'N/A'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Suggested Lot Rent:</Text>
            <Text style={styles.value}>
              ${intelligence?.suggestedLotRentLow}-${intelligence?.suggestedLotRentHigh}/mo
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Median HH Income:</Text>
            <Text style={styles.value}>
              ${intelligence?.medianHouseholdIncome?.toLocaleString() || 'N/A'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Unemployment Rate:</Text>
            <Text style={styles.value}>
              {intelligence?.unemploymentRate ? `${intelligence.unemploymentRate}%` : 'N/A'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nearby MH Parks:</Text>
            <Text style={styles.value}>
              {intelligence?.nearbyParksCount || 0} within 10 miles
            </Text>
          </View>
        </View>

        {/* AI Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Analysis</Text>

          <Text style={{ fontSize: 11, marginBottom: 5, fontWeight: 'bold' }}>
            Recommendation: {intelligence?.aiRecommendation?.toUpperCase() || 'N/A'}
            {intelligence?.aiConfidenceScore
              ? ` (${intelligence.aiConfidenceScore}% confidence)`
              : ''}
          </Text>

          <Text style={{ fontSize: 10, marginTop: 10, marginBottom: 5 }}>Insights:</Text>
          {intelligence?.aiInsights?.map((insight: string, i: number) => (
            <Text key={i} style={styles.insight}>
              • {insight}
            </Text>
          ))}

          <Text style={{ fontSize: 10, marginTop: 10, marginBottom: 5 }}>Risk Factors:</Text>
          {intelligence?.aiRiskFactors?.map((risk: string, i: number) => (
            <Text key={i} style={styles.insight}>
              ⚠ {risk}
            </Text>
          ))}

          <Text style={{ fontSize: 10, marginTop: 10, marginBottom: 5 }}>Opportunities:</Text>
          {intelligence?.aiOpportunities?.map((opp: string, i: number) => (
            <Text key={i} style={styles.insight}>
              ✓ {opp}
            </Text>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by DealForge | This report is for informational purposes only
          and does not constitute financial advice.
        </Text>
      </Page>
    </Document>
  );
}
```

Create API route for report generation at `apps/web/app/api/v1/leads/[leadId]/report/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { auth } from '@/lib/auth';
import { getLead } from '@/lib/leads/actions';
import { DueDiligenceReport } from '@/lib/reports/templates/due-diligence';
import { db } from '@workspace/database';
import { leadReports } from '@workspace/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const lead = await getLead(params.leadId);
  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const generatedAt = new Date();

  // Generate PDF
  const pdfBuffer = await renderToBuffer(
    <DueDiligenceReport
      lead={lead}
      intelligence={lead.intelligence}
      generatedAt={generatedAt}
    />
  );

  // Save report record
  const fileName = `DealForge_Report_${lead.id}_${Date.now()}.pdf`;
  await db.insert(leadReports).values({
    leadId: lead.id,
    reportType: 'due_diligence',
    fileName,
    fileSizeBytes: pdfBuffer.length,
    generatedBy: session.user.id,
  });

  // Return PDF
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
```

---

### Story 8: AI Deal Scout Integration

**Acceptance Criteria:**
- [ ] New `analyzePropertyLead` tool added to Deal Scout
- [ ] Tool accepts address + optional details
- [ ] Returns comprehensive intelligence
- [ ] Can be invoked via chat: "Analyze this lead: 122 County Rd..."

**Implementation:**

Create `apps/web/lib/ai/tools/analyze-property-lead.ts`:

```typescript
import { tool } from 'ai';
import { z } from 'zod';
import { createLead, getLead } from '@/lib/leads/actions';

export const analyzePropertyLead = tool({
  description: `Analyze a property lead by gathering intelligence from all available sources.
    Creates a lead record, geocodes the address, checks utility coverage, fetches market data,
    finds nearby parks, and runs AI analysis. Returns comprehensive intelligence report.`,
  inputSchema: z.object({
    address: z.string().describe('Full property address'),
    askingPrice: z.number().optional().describe('Asking price in dollars'),
    propertyType: z
      .enum(['singlewide', 'doublewide', 'land_only', 'land_with_home', 'park', 'other'])
      .optional(),
    yearBuilt: z.number().optional(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    acreage: z.number().optional(),
    condition: z
      .enum(['excellent', 'good', 'average', 'fair', 'poor', 'needs_rehab', 'unknown'])
      .optional(),
    conditionNotes: z.string().optional(),
    mortgageBalance: z.number().optional(),
    sellerMotivation: z.string().optional(),
  }),
  execute: async (params) => {
    // Create lead (this will trigger intelligence gathering)
    const result = await createLead({
      addressRaw: params.address,
      propertyType: params.propertyType,
      yearBuilt: params.yearBuilt,
      bedrooms: params.bedrooms,
      bathrooms: params.bathrooms,
      acreage: params.acreage,
      condition: params.condition,
      conditionNotes: params.conditionNotes,
      askingPrice: params.askingPrice,
      mortgageBalance: params.mortgageBalance,
      sellerMotivation: params.sellerMotivation,
    });

    if (!result.success || !result.leadId) {
      return { error: 'Failed to create lead', details: result.error };
    }

    // Wait for intelligence gathering to complete (with timeout)
    let attempts = 0;
    let lead = null;
    while (attempts < 30) {
      // 30 second timeout
      await new Promise((resolve) => setTimeout(resolve, 1000));
      lead = await getLead(result.leadId);
      if (lead?.status === 'analyzed') break;
      attempts++;
    }

    if (!lead) {
      return { error: 'Lead analysis timed out' };
    }

    return {
      leadId: lead.id,
      address: lead.addressFormatted || lead.addressRaw,
      location: {
        city: lead.city,
        county: lead.county,
        coordinates:
          lead.latitude && lead.longitude
            ? { lat: lead.latitude, lng: lead.longitude }
            : null,
      },
      utilities: {
        water: lead.intelligence?.hasWaterCcn === 'yes',
        waterProvider: lead.intelligence?.waterProvider,
        sewer: lead.intelligence?.hasSewerCcn === 'yes',
        sewerProvider: lead.intelligence?.sewerProvider,
      },
      market: {
        fmrTwoBedroom: lead.intelligence?.fmrTwoBedroom,
        suggestedLotRent: {
          low: lead.intelligence?.suggestedLotRentLow,
          high: lead.intelligence?.suggestedLotRentHigh,
        },
        medianIncome: lead.intelligence?.medianHouseholdIncome,
        unemployment: lead.intelligence?.unemploymentRate,
      },
      nearbyParks: lead.intelligence?.nearbyParksData || [],
      aiAnalysis: {
        insights: lead.intelligence?.aiInsights || [],
        riskFactors: lead.intelligence?.aiRiskFactors || [],
        opportunities: lead.intelligence?.aiOpportunities || [],
        recommendation: lead.intelligence?.aiRecommendation,
        confidence: lead.intelligence?.aiConfidenceScore,
      },
      viewUrl: `/leads/${lead.id}`,
    };
  },
});
```

Add to `apps/web/lib/ai/tools/index.ts`:

```typescript
import { analyzePropertyLead } from './analyze-property-lead';

export const dealScoutTools = {
  // ... existing tools
  analyzePropertyLead,
};
```

---

## Testing Checklist

- [ ] Create lead with minimal info (address only)
- [ ] Create lead with full info
- [ ] Verify geocoding works
- [ ] Verify CCN check works
- [ ] Verify market data fetching
- [ ] Verify nearby parks query
- [ ] Verify AI analysis runs
- [ ] Generate PDF report
- [ ] Test Deal Scout integration
- [ ] Test mobile responsiveness
- [ ] Test error handling (invalid address, API failures)

---

## Environment Variables Required

```env
# Existing
DATABASE_URL=
MAPBOX_ACCESS_TOKEN=
OPENAI_API_KEY=

# No new env vars required for this epic
```

---

## Dependencies to Add

```bash
pnpm add @react-pdf/renderer -w --filter @workspace/web
```

---

## Estimated Effort

| Story | Effort | Dependencies |
|-------|--------|--------------|
| 1. Database Schema | S (2h) | None |
| 2. Lead Intake Form | M (4h) | Story 1 |
| 3. Server Actions | M (3h) | Story 1 |
| 4. Intelligence Service | L (6h) | Story 1, 3 |
| 5. Lead Detail Page | M (4h) | Story 1-4 |
| 6. Lead List Dashboard | M (3h) | Story 1-3 |
| 7. PDF Report Generator | M (4h) | Story 1-5 |
| 8. AI Tool Integration | S (2h) | Story 1-4 |

**Total: ~28 hours (3-4 days)**

---

## Success Metrics

1. **Lead creation time:** < 30 seconds to submit form
2. **Intelligence gathering time:** < 60 seconds to analyze
3. **Report generation time:** < 10 seconds to generate PDF
4. **User adoption:** Leads submitted per week
5. **Report generation rate:** Reports per lead

---

## Future Enhancements (Out of Scope)

- Flood zone API integration (FEMA)
- Parcel data integration (TxGIO)
- Report storage in cloud (S3/R2)
- Email report delivery
- Report customization options
- Lead sharing between users
- CRM integration
- Automated follow-up reminders

---

*This implementation plan is ready for handoff to a coding agent.*
