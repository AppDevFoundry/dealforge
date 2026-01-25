import { redirect } from 'next/navigation';

import { ChatContextProvider, ChatFAB, ChatPanel } from '@/components/ai';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { MobileHeader } from '@/components/layout/mobile-nav';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getServerSession, getUserRole } from '@/lib/auth-server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session) {
    redirect('/sign-in');
  }

  // Check if user has admin role
  const role = await getUserRole(session.user.id);
  if (role !== 'admin' && role !== 'owner') {
    redirect('/dashboard');
  }

  return (
    <ChatContextProvider>
      <SidebarProvider>
        <AppSidebar user={session.user} isAdmin={true} />
        <SidebarInset>
          <MobileHeader user={session.user} />
          <main className="flex-1">{children}</main>
        </SidebarInset>

        <ChatFAB />
        <ChatPanel />
      </SidebarProvider>
    </ChatContextProvider>
  );
}
