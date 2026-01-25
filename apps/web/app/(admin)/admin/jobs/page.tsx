import { Suspense } from 'react';

import { JobStatusTable } from '@/components/admin/job-status-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Jobs | Admin | DealForge',
  description: 'View background job status and history',
};

export default function JobsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Background Jobs</h1>
        <p className="text-muted-foreground">Monitor and manage background processing jobs.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Jobs</CardTitle>
          <CardDescription>Complete history of background jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-[400px]" />}>
            <JobStatusTable limit={50} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
