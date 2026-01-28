'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { useCreateLead } from '@/lib/hooks/use-leads';
import { type CreateLeadInput, CreateLeadSchema } from '@dealforge/types';

import { AddressStep } from './lead-intake-steps/address-step';
import { FinancialsStep } from './lead-intake-steps/financials-step';
import { PropertyStep } from './lead-intake-steps/property-step';
import { SellerStep } from './lead-intake-steps/seller-step';

const STEPS = [
  { id: 'address', title: 'Address', description: 'Property location' },
  { id: 'property', title: 'Property', description: 'Details about the property' },
  { id: 'financials', title: 'Financials', description: 'Pricing and income' },
  { id: 'seller', title: 'Seller', description: 'Seller information' },
] as const;

export function LeadIntakeForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const createLead = useCreateLead();

  const form = useForm<CreateLeadInput>({
    resolver: zodResolver(CreateLeadSchema),
    defaultValues: {
      address: '',
    },
    mode: 'onChange',
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    trigger,
    watch,
    setValue,
  } = form;

  const watchedAddress = watch('address');

  const canProceed = () => {
    if (currentStep === 0) {
      return watchedAddress && watchedAddress.length >= 5;
    }
    return true;
  };

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isStepValid = await trigger(fieldsToValidate);

    if (isStepValid && currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Track if user has explicitly requested submission
  // This prevents auto-submission when transitioning to step 4 (a React/form quirk)
  const [submitRequested, setSubmitRequested] = useState(false);

  const onSubmit = async (data: CreateLeadInput) => {
    // Only submit if user explicitly requested it (clicked Create Lead button)
    if (!submitRequested) {
      return;
    }

    try {
      const result = await createLead.mutateAsync(data);
      router.push(`/leads/${result.data.id}`);
    } catch (error) {
      console.error('Failed to create lead:', error);
      setSubmitRequested(false); // Reset on error so user can retry
    }
  };

  const handleExplicitSubmit = () => {
    setSubmitRequested(true);
  };

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
        <div className="relative flex justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index <= currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}
              </div>
              <div className="mt-2 text-center">
                <div
                  className={`text-sm font-medium ${
                    index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {currentStep === 0 && (
          <AddressStep register={register} errors={errors} setValue={setValue} watch={watch} />
        )}
        {currentStep === 1 && <PropertyStep register={register} errors={errors} />}
        {currentStep === 2 && <FinancialsStep register={register} errors={errors} />}
        {currentStep === 3 && <SellerStep register={register} errors={errors} watch={watch} />}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext} disabled={!canProceed()}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" onClick={handleExplicitSubmit} disabled={createLead.isPending}>
              {createLead.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Lead'
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function getFieldsForStep(step: number): (keyof CreateLeadInput)[] {
  switch (step) {
    case 0:
      return ['address'];
    case 1:
      return [
        'propertyType',
        'propertyCondition',
        'yearBuilt',
        'lotSize',
        'homeSize',
        'bedrooms',
        'bathrooms',
        'lotCount',
      ];
    case 2:
      return [
        'askingPrice',
        'estimatedValue',
        'lotRent',
        'monthlyIncome',
        'annualTaxes',
        'annualInsurance',
      ];
    case 3:
      return [
        'sellerName',
        'sellerPhone',
        'sellerEmail',
        'sellerMotivation',
        'leadSource',
        'notes',
      ];
    default:
      return [];
  }
}
