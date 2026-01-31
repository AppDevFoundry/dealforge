import { VerificationToast } from '@/components/auth/verification-toast';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calculator, Calendar, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard',
  description: 'Your DealForge dashboard',
};

export default function DashboardPage() {
  return (
    <div className="container py-8">
      {/* Show verification success toast if redirected from email verification */}
      <Suspense fallback={null}>
        <VerificationToast />
      </Suspense>

      {/* Header with premium styling */}
      <div className="flex items-center justify-between">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight headline-premium">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s an overview of your deals.
          </p>
        </div>
        <Button asChild className="animate-fade-in delay-200 group gap-2 hover-lift">
          <Link href="/analyze">
            <Sparkles className="size-4" />
            New Analysis
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>

      {/* Quick Stats with staggered animations */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Deals"
          value="0"
          description="Saved analyses"
          icon={Calculator}
          delay="delay-100"
        />
        <StatCard
          title="Average CoC Return"
          value="--"
          description="Across all deals"
          icon={TrendingUp}
          delay="delay-200"
          highlight
        />
        <StatCard
          title="This Month"
          value="0"
          description="New analyses"
          icon={Calendar}
          delay="delay-300"
        />
      </div>

      {/* Recent Deals with enhanced empty state */}
      <div className="mt-10 animate-fade-in delay-400">
        <h2 className="text-xl font-semibold headline-premium">Recent Deals</h2>
        <div className="mt-4 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-12 text-center transition-colors hover:border-primary/30 hover:bg-muted/50">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Calculator className="size-8 text-primary" />
          </div>
          <p className="text-lg font-medium text-foreground">No deals yet</p>
          <p className="mt-1 text-muted-foreground">
            Start by analyzing a property to see it here!
          </p>
          <Button asChild size="lg" className="mt-6 group gap-2 hover-lift animate-glow-pulse">
            <Link href="/analyze">
              Analyze Your First Deal
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  delay = '',
  highlight = false,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  delay?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`
        animate-scale-bounce ${delay}
        card-premium group relative overflow-hidden
        ${highlight ? 'border-primary/30 bg-primary/5' : ''}
      `}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div
            className={`
            flex size-9 items-center justify-center rounded-lg transition-all duration-300
            ${highlight ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}
            group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110
          `}
          >
            <Icon className="size-4" />
          </div>
        </div>
        <p className={`mt-3 text-3xl metric-value ${highlight ? 'text-primary' : ''}`}>{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>

      {/* Bottom accent line for highlighted cards */}
      {highlight && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
      )}
    </div>
  );
}
