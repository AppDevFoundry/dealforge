import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import Link from 'next/link';
import {
  Sparkles,
  Calculator,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  Github,
  BarChart3,
  Shield,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">DealForge</span>
          </Link>
          <nav className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.15),transparent)]" />

          <div className="container py-20 md:py-28 lg:py-32">
            <div className="mx-auto max-w-4xl text-center">
              {/* Badge */}
              <div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
                <span className="flex size-2 rounded-full bg-primary animate-pulse" />
                <span className="text-muted-foreground">Open Source</span>
                <span className="text-foreground font-medium">AI-Native Platform</span>
              </div>

              {/* Headline */}
              <h1 className="animate-fade-in text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl [animation-delay:100ms]">
                Forge Better Deals with{' '}
                <span className="relative">
                  <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                    Data
                  </span>
                  <svg
                    className="absolute -bottom-1 left-0 w-full"
                    viewBox="0 0 200 8"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M1 5.5C47 2 87 2 100 3.5C113 5 153 6 199 2"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="opacity-50"
                    />
                  </svg>
                </span>
                , Not Gut Feelings
              </h1>

              {/* Subheadline */}
              <p className="animate-fade-in mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl [animation-delay:200ms]">
                Institutional-grade real estate analysis tools, AI-powered insights, and educational
                resources — all open source and free to start.
              </p>

              {/* CTA Buttons */}
              <div className="animate-fade-in mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center [animation-delay:300ms]">
                <Button size="lg" className="group gap-2 px-6" asChild>
                  <Link href="/sign-up">
                    Start Analyzing for Free
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="gap-2 px-6" asChild>
                  <Link href="/analyze">
                    <Calculator className="size-4" />
                    Try a Calculator
                  </Link>
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="animate-fade-in mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground [animation-delay:400ms]">
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-primary" />
                  <span>Bank-grade calculations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-primary" />
                  <span>Instant results</span>
                </div>
                <div className="flex items-center gap-2">
                  <Github className="size-4 text-primary" />
                  <span>100% open source</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-muted/30 py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Everything You Need to Analyze Deals
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                From your first rental property to complex syndications, DealForge grows with you.
              </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
              <FeatureCard
                icon={Sparkles}
                title="AI-Native Analysis"
                description="Paste a listing URL and let AI extract the data. Chat about your deal to understand the numbers better."
                gradient="from-violet-500/20 to-purple-500/20"
              />
              <FeatureCard
                icon={GraduationCap}
                title="Learn as You Go"
                description="Every calculator includes Learn Mode that explains what each metric means and why it matters."
                gradient="from-blue-500/20 to-cyan-500/20"
              />
              <FeatureCard
                icon={TrendingUp}
                title="Market Intelligence"
                description="Get context with rent estimates, neighborhood data, and growth indicators powered by open data."
                gradient="from-emerald-500/20 to-teal-500/20"
              />
            </div>
          </div>
        </section>

        {/* Calculators Preview Section */}
        <section className="border-t py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Professional Calculators
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                From simple rental analysis to complex waterfall distributions.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CalculatorCard
                title="Rental Property"
                description="Cash flow, ROI, cap rate"
                status="available"
              />
              <CalculatorCard
                title="BRRRR"
                description="Buy-Rehab-Rent-Refinance-Repeat"
                status="coming"
              />
              <CalculatorCard
                title="Fix & Flip"
                description="ARV, rehab budget, profit"
                status="coming"
              />
              <CalculatorCard
                title="House Hack"
                description="Owner-occupied analysis"
                status="coming"
              />
              <CalculatorCard
                title="Multi-Family"
                description="5-50 unit properties"
                status="coming"
              />
              <CalculatorCard
                title="Syndication"
                description="Waterfall distributions"
                status="coming"
              />
            </div>

            <div className="mt-10 text-center">
              <Button variant="outline" size="lg" className="gap-2" asChild>
                <Link href="/analyze">
                  <BarChart3 className="size-4" />
                  View All Calculators
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t bg-muted/30 py-20 md:py-28">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Ready to Make Better Investment Decisions?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Join thousands of investors using DealForge to analyze deals with confidence.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" className="gap-2 px-8" asChild>
                  <Link href="/sign-up">
                    Create Free Account
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex aspect-square size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-3.5" />
              </div>
              <span className="font-semibold">DealForge</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Open source under AGPL-3.0. Built with Next.js, Rust, and Claude.
            </p>
            <div className="flex gap-6">
              <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </Link>
              <Link
                href="https://github.com/yourusername/dealforge"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg">
      {/* Gradient background on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity group-hover:opacity-100`} />

      <div className="relative">
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="size-6" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function CalculatorCard({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: 'available' | 'coming';
}) {
  const isAvailable = status === 'available';

  return (
    <div
      className={`group relative rounded-xl border p-4 transition-all ${
        isAvailable
          ? 'bg-card hover:border-primary/50 hover:shadow-md cursor-pointer'
          : 'bg-muted/30 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {isAvailable ? (
          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            Available
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Coming
          </span>
        )}
      </div>
      {isAvailable && (
        <Link href="/analyze/rental" className="absolute inset-0">
          <span className="sr-only">Open {title} calculator</span>
        </Link>
      )}
    </div>
  );
}
