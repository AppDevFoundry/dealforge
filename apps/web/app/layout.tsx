import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/providers/theme-provider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'DealForge',
    template: '%s | DealForge',
  },
  description:
    'Open-source, AI-native real estate analysis platform. Forge better deals with data, not gut feelings.',
  keywords: [
    'real estate',
    'investment',
    'analysis',
    'calculator',
    'rental property',
    'BRRRR',
    'cap rate',
    'cash flow',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
