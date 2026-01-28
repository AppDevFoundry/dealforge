import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { LeadIntakeForm } from '@/components/leads/lead-intake-form';
import { Button } from '@/components/ui/button';

export default function NewLeadPage() {
  return (
    <div className="container py-6 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/leads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leads
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Add New Lead</h1>
        <p className="text-muted-foreground">
          Enter property details to create a new lead and gather intelligence
        </p>
      </div>

      {/* Form */}
      <LeadIntakeForm />
    </div>
  );
}
