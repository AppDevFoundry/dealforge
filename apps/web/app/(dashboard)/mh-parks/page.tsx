import { Calculator, MapPin, Search, TrendingUp } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'MH Parks | DealForge',
  description: 'Manufactured housing park intelligence and analysis tools',
};

const sections = [
  {
    title: 'Park Map',
    description: 'Interactive map of MH communities across Texas with filtering by property type.',
    href: '/mh-parks/map',
    icon: MapPin,
  },
  {
    title: 'Market Activity',
    description: 'Monthly titling trends, county breakdowns, and market movement indicators.',
    href: '/mh-parks/activity',
    icon: TrendingUp,
  },
  {
    title: 'Park Search',
    description:
      'Search and filter communities by county, lot count, type, and more. Export to CSV.',
    href: '/mh-parks/search',
    icon: Search,
  },
  {
    title: 'Park Calculator',
    description: 'Analyze MH park investments with lot rent, occupancy, and financing assumptions.',
    href: '/mh-parks/calculator',
    icon: Calculator,
  },
];

export default function MhParksPage() {
  return (
    <div className="container max-w-7xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">MH Park Intelligence</h1>
        <p className="text-muted-foreground">
          Manufactured housing community data, market activity, and analysis tools for Texas
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <section.icon className="size-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
