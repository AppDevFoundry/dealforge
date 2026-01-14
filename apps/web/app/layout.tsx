import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

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
      <body className={`${inter.variable} font-sans`}>{children}</body>
    </html>
  );
}
