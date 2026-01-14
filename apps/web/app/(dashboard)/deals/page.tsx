import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'My Deals',
  description: 'Your saved deal analyses',
};

export default function DealsPage() {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Deals</h1>
          <p className="text-muted-foreground">View and manage your saved deal analyses.</p>
        </div>
        <Button asChild>
          <Link href="/analyze">New Analysis</Link>
        </Button>
      </div>

      {/* Filters (placeholder) */}
      <div className="mt-6 flex gap-4">
        <Button variant="outline" size="sm">
          All Types
        </Button>
        <Button variant="outline" size="sm">
          Status
        </Button>
        <Button variant="outline" size="sm">
          Sort
        </Button>
      </div>

      {/* Empty State */}
      <div className="mt-8 rounded-lg border p-12 text-center">
        <div className="mx-auto max-w-md">
          <h3 className="text-lg font-semibold">No deals yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Your saved deal analyses will appear here. Start by analyzing a rental property, BRRRR
            deal, or flip.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Button asChild>
              <Link href="/analyze">Start Analyzing</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
