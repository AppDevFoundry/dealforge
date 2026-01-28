'use client';

import { LeadIntakeForm } from '@/components/leads/lead-intake-form';
import { useCreateLead } from '@/lib/hooks/use-leads';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function NewLeadPage() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateLead();

  const handleSubmit = async (data: Parameters<typeof mutateAsync>[0]) => {
    try {
      const result = await mutateAsync(data);
      toast.success('Lead created', {
        description: 'Intelligence gathering has started automatically.',
      });
      router.push(`/leads/${result.data.id}`);
    } catch (err) {
      toast.error('Failed to create lead', {
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
      });
    }
  };

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight headline-premium">New Lead</h1>
          <p className="text-muted-foreground">
            Enter property details and we will automatically gather intelligence data.
          </p>
        </div>

        <LeadIntakeForm onSubmit={handleSubmit} isLoading={isPending} />
      </div>
    </div>
  );
}
