'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { AddressStep } from '@/components/leads/lead-intake-steps/address-step';
import { FinancialsStep } from '@/components/leads/lead-intake-steps/financials-step';
import { PropertyStep } from '@/components/leads/lead-intake-steps/property-step';
import { SellerStep } from '@/components/leads/lead-intake-steps/seller-step';
import { Button } from '@/components/ui/button';
import { useLead, useUpdateLead } from '@/lib/hooks/use-leads';
import { type PropertyFeature, type UpdateLeadInput, UpdateLeadSchema } from '@dealforge/types';

interface PageProps {
  params: Promise<{ leadId: string }>;
}

const STEPS = [
  { id: 'address', title: 'Address', description: 'Property location' },
  { id: 'property', title: 'Property', description: 'Details about the property' },
  { id: 'financials', title: 'Financials', description: 'Pricing and income' },
  { id: 'seller', title: 'Seller', description: 'Seller information' },
] as const;

export default function EditLeadPage({ params }: PageProps) {
  const { leadId } = use(params);
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const { data: leadData, isLoading: isLoadingLead } = useLead(leadId);
  const updateLead = useUpdateLead();

  const form = useForm<UpdateLeadInput>({
    resolver: zodResolver(UpdateLeadSchema),
    mode: 'onChange',
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    setValue,
    reset,
  } = form;

  // Populate form when lead data loads
  useEffect(() => {
    if (leadData?.data) {
      const lead = leadData.data;
      const metadata = lead.metadata as { features?: PropertyFeature[] } | null;

      reset({
        address: lead.address,
        propertyType: lead.propertyType ?? undefined,
        propertyCondition: lead.propertyCondition ?? undefined,
        yearBuilt: lead.yearBuilt ?? undefined,
        lotSize: lead.lotSize ?? undefined,
        homeSize: lead.homeSize ?? undefined,
        bedrooms: lead.bedrooms ?? undefined,
        bathrooms: lead.bathrooms ?? undefined,
        lotCount: lead.lotCount ?? undefined,
        askingPrice: lead.askingPrice ?? undefined,
        estimatedValue: lead.estimatedValue ?? undefined,
        lotRent: lead.lotRent ?? undefined,
        monthlyIncome: lead.monthlyIncome ?? undefined,
        annualTaxes: lead.annualTaxes ?? undefined,
        annualInsurance: lead.annualInsurance ?? undefined,
        sellerName: lead.sellerName ?? undefined,
        sellerPhone: lead.sellerPhone ?? undefined,
        sellerEmail: lead.sellerEmail ?? undefined,
        sellerMotivation: lead.sellerMotivation ?? undefined,
        leadSource: (lead.leadSource as UpdateLeadInput['leadSource']) ?? undefined,
        notes: lead.notes ?? undefined,
        features: metadata?.features ?? [],
      });
    }
  }, [leadData, reset]);

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

  const onSubmit = async (data: UpdateLeadInput) => {
    try {
      await updateLead.mutateAsync({ id: leadId, data });
      router.push(`/leads/${leadId}`);
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  };

  if (isLoadingLead) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!leadData?.data) {
    return (
      <div className="container py-6">
        <div className="text-center py-12">
          <p className="text-destructive">Lead not found.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/leads">Back to Leads</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/leads/${leadId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lead
          </Link>
        </Button>
        <h1 className="text-2xl font-bold mt-4">Edit Lead</h1>
        <p className="text-muted-foreground">{leadData.data.address}</p>
      </div>

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
        {/* Note: Using type assertions because UpdateLeadInput and CreateLeadInput are compatible
            for the fields used by these step components, but have different TypeScript types */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {currentStep === 0 && (
            <AddressStep
              register={register as never}
              errors={errors as never}
              setValue={setValue as never}
              watch={watch as never}
            />
          )}
          {currentStep === 1 && (
            <PropertyStep
              register={register as never}
              errors={errors as never}
              setValue={setValue as never}
              watch={watch as never}
            />
          )}
          {currentStep === 2 && (
            <FinancialsStep register={register as never} errors={errors as never} />
          )}
          {currentStep === 3 && (
            <SellerStep
              register={register as never}
              errors={errors as never}
              watch={watch as never}
            />
          )}

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
              <Button type="submit" disabled={updateLead.isPending}>
                {updateLead.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function getFieldsForStep(step: number): (keyof UpdateLeadInput)[] {
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
        'features',
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
