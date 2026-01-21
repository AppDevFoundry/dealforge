'use client';

import { ActivityDashboard } from '@/components/mh-parks/activity/activity-dashboard';

export default function MhParksActivityPage() {
  return (
    <div className="container max-w-7xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Market Activity</h1>
        <p className="text-muted-foreground">
          Monthly titling trends and county-level manufactured housing activity in Texas
        </p>
      </div>
      <ActivityDashboard />
    </div>
  );
}
