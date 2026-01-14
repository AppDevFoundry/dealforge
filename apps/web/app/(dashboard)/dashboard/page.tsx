import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard',
  description: 'Your DealForge dashboard',
};

export default function DashboardPage() {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your deals.
          </p>
        </div>
        <Button asChild>
          <Link href="/analyze">New Analysis</Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard title="Total Deals" value="0" description="Saved analyses" />
        <StatCard title="Average CoC Return" value="--" description="Across all deals" />
        <StatCard title="This Month" value="0" description="New analyses" />
      </div>

      {/* Recent Deals */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold">Recent Deals</h2>
        <div className="mt-4 rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">No deals yet. Start by analyzing a property!</p>
          <Button asChild className="mt-4">
            <Link href="/analyze">Analyze Your First Deal</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
