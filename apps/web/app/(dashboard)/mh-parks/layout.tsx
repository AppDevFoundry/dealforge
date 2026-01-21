import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MH Parks | DealForge',
  description: 'Mobile Home Park data and analysis for Texas',
};

interface MhParksLayoutProps {
  children: React.ReactNode;
}

export default function MhParksLayout({ children }: MhParksLayoutProps) {
  return <>{children}</>;
}
