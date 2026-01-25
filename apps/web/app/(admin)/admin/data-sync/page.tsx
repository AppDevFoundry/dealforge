import { Suspense } from 'react';

import { JobStatusTable } from '@/components/admin/job-status-table';
import { SyncActions } from '@/components/admin/sync-actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Data Sync | Admin | DealForge',
  description: 'Manage TDHCA data sync and imports',
};

export default function DataSyncPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Data Sync Management</h1>
        <p className="text-muted-foreground">
          Import TDHCA data, run park discovery, and manage sync jobs.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sync Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sync Actions</CardTitle>
            <CardDescription>Upload CSV files or trigger data processing jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <SyncActions />
          </CardContent>
        </Card>

        {/* Data Coverage Card */}
        <Card>
          <CardHeader>
            <CardTitle>Data Coverage</CardTitle>
            <CardDescription>Current data coverage by county and data type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>Data coverage stats coming soon...</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Jobs</CardTitle>
          <CardDescription>Status of recent data sync and processing jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-[200px]" />}>
            <JobStatusTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
