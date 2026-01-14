import { UserNav } from '@/components/auth/user-nav';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { getServerSession } from '@/lib/auth-server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session) {
    redirect('/sign-in');
  }

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
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserNav user={session.user} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
