import { AppSidebar } from '@/components/layout/app-sidebar';
import { MobileHeader } from '@/components/layout/mobile-nav';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getServerSession } from '@/lib/auth-server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session) {
    redirect('/sign-in');
  }

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <SidebarInset className="border-l border-border">
        {/* Mobile Header - only visible on mobile */}
        <MobileHeader user={session.user} />

        {/* Desktop Header - only visible on desktop */}
        <header className="sticky top-0 z-40 hidden h-14 shrink-0 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:flex">
          <div className="ml-auto flex items-center gap-2 px-4">
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
