import { Activity, Database, HardDrive, MapPin } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Admin Dashboard | DealForge',
  description: 'Admin dashboard for data management and system settings',
};

const adminSections = [
  {
    title: 'Data Sync',
    description: 'Manage TDHCA data imports, sync jobs, and data freshness',
    href: '/admin/data-sync',
    icon: Database,
    stats: 'View sync status',
  },
  {
    title: 'MH Parks',
    description: 'Edit, merge, and manage mobile home park records',
    href: '/admin/parks',
    icon: MapPin,
    stats: 'Manage parks',
  },
  {
    title: 'Jobs',
    description: 'View background job status and history',
    href: '/admin/jobs',
    icon: Activity,
    stats: 'View jobs',
  },
  {
    title: 'System',
    description: 'System health, database stats, and configuration',
    href: '/admin/system',
    icon: HardDrive,
    stats: 'View system',
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage data, system settings, and monitor application health.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {adminSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{section.title}</CardTitle>
                <section.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">{section.description}</CardDescription>
                <p className="mt-2 text-xs text-primary">{section.stats} →</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
