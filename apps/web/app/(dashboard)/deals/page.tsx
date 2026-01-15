import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'My Deals',
  description: 'Your saved deal analyses',
};

export default function DealsPage() {
  return (
    <div className="container py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight headline-premium">My Deals</h1>
          <p className="text-muted-foreground">View and manage your saved deal analyses.</p>
        </div>
        <Button asChild>
          <Link href="/analyze">New Analysis</Link>
        </Button>
      </div>

      {/* Filters (placeholder) */}
      <div className="mt-6 flex flex-wrap gap-2 sm:gap-4">
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
      <div className="mt-8 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-12 text-center">
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
