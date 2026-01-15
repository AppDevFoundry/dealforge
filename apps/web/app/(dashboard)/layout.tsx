import { AppSidebar } from '@/components/layout/app-sidebar';
import { MobileHeader } from '@/components/layout/mobile-nav';
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
      <SidebarInset>
        {/* Mobile Header - only visible on mobile */}
        <MobileHeader user={session.user} />

        {/* Main Content */}
        <main className="flex-1 px-4 md:px-6 lg:px-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
