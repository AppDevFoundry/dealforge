import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Dashboard Header */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold">DealForge</span>
            </Link>
            <nav className="hidden items-center gap-4 md:flex">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/deals"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                My Deals
              </Link>
              <Link
                href="/analyze"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Analyze
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              Profile
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
