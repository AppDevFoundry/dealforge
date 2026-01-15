import { SidebarProvider } from '@/components/ui/sidebar';
import { type RenderOptions, type RenderResult, render as rtlRender } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'next-themes';
import type { ReactElement, ReactNode } from 'react';

// ============================================
// Mock Session Type
// ============================================
interface MockUser {
  id: string;
  email: string;
  name: string;
  image?: string;
}

interface MockSession {
  user: MockUser;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
}

// ============================================
// Test Providers
// ============================================
interface AllProvidersProps {
  children: ReactNode;
  session?: MockSession | null;
  theme?: 'light' | 'dark' | 'system';
  withSidebar?: boolean;
}

function AllProviders({ children, theme = 'light', withSidebar = false }: AllProvidersProps) {
  const content = withSidebar ? (
    <SidebarProvider defaultOpen={true}>{children}</SidebarProvider>
  ) : (
    children
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={theme}
      enableSystem={false}
      disableTransitionOnChange
    >
      {content}
    </ThemeProvider>
  );
}

// ============================================
// Custom Render Function
// ============================================
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: MockSession | null;
  theme?: 'light' | 'dark' | 'system';
  withSidebar?: boolean;
}

function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { user: UserEvent } {
  const { session, theme, withSidebar, ...renderOptions } = options;

  const renderResult = rtlRender(ui, {
    wrapper: ({ children }) => (
      <AllProviders session={session} theme={theme} withSidebar={withSidebar}>
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  });

  return {
    user: userEvent.setup(),
    ...renderResult,
  };
}

// ============================================
// Re-export everything from testing-library
// ============================================
export * from '@testing-library/react';
export { customRender as render };
export { userEvent };
