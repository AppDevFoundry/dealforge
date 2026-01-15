import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BarChart3,
  Calculator,
  Github,
  GraduationCap,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header with glass effect */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
              <Sparkles className="size-4 transition-transform duration-300 group-hover:rotate-12" />
            </div>
            <span className="text-lg font-semibold tracking-tight">DealForge</span>
          </Link>
          <nav className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button size="sm" asChild className="hover-lift">
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section with dramatic background */}
        <section className="relative overflow-hidden">
          {/* Animated gradient mesh background */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.2),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_80%_80%,hsl(var(--brand-300)/0.1),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_20%_60%,hsl(var(--brand-400)/0.08),transparent)]" />
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,black,transparent)]" />
          </div>

          <div className="container py-20 md:py-28 lg:py-36">
            <div className="mx-auto max-w-4xl text-center">
              {/* Animated Badge */}
              <div className="animate-slide-up-blur mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm backdrop-blur-sm">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-primary" />
                </span>
                <span className="text-muted-foreground">Open Source</span>
                <span className="text-foreground font-semibold">AI-Native Platform</span>
              </div>

              {/* Headline with blur-to-sharp animation */}
              <h1 className="animate-slide-up-blur delay-100 text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl headline-premium">
                Forge Better Deals with{' '}
                <span className="relative inline-block">
                  <span className="text-gradient-primary">Data,</span>
                  {/* Animated underline SVG */}
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 200 12"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 8C30 4 60 2 100 4C140 6 170 4 198 8"
                      stroke="hsl(var(--primary))"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className="animate-draw-line delay-700"
                      style={{ filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.5))' }}
                    />
                  </svg>
                </span>{' '}
                Not Gut Feelings
              </h1>

              {/* Subheadline */}
              <p className="animate-slide-up-blur delay-200 mx-auto mt-8 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed">
                Institutional-grade real estate analysis tools, AI-powered insights, and educational
                resources — all open source and free to start.
              </p>

              {/* CTA Buttons with enhanced styling */}
              <div className="animate-slide-up-blur delay-300 mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button size="xl" className="group gap-2 hover-lift" asChild>
                  <Link href="/sign-up">
                    Start Analyzing for Free
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  className="gap-2 hover-lift border-primary/30 hover:border-primary/50 hover:bg-primary/5"
                  asChild
                >
                  <Link href="/analyze">
                    <Calculator className="size-4" />
                    Try a Calculator
                  </Link>
                </Button>
              </div>

              {/* Trust indicators with stagger */}
              <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-muted-foreground">
                <div className="animate-fade-in delay-400 flex items-center gap-2.5 group">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Shield className="size-4 text-primary" />
                  </div>
                  <span>Bank-grade calculations</span>
                </div>
                <div className="animate-fade-in delay-500 flex items-center gap-2.5 group">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Zap className="size-4 text-primary" />
                  </div>
                  <span>Instant results</span>
                </div>
                <div className="animate-fade-in delay-600 flex items-center gap-2.5 group">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Github className="size-4 text-primary" />
                  </div>
                  <span>100% open source</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section with premium styling */}
        <section className="relative border-t py-24 md:py-32 overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 -z-10 bg-muted/30" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_50%_at_50%_100%,hsl(var(--primary)/0.05),transparent)]" />

          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl headline-premium">
                Everything You Need to Analyze Deals
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                From your first rental property to complex syndications, DealForge grows with you.
              </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
              <FeatureCard
                icon={Sparkles}
                title="AI-Native Analysis"
                description="Paste a listing URL and let AI extract the data. Chat about your deal to understand the numbers better."
                gradient="from-violet-500/20 via-purple-500/10 to-transparent"
                iconBg="bg-violet-500/10 group-hover:bg-violet-500"
                delay="delay-100"
              />
              <FeatureCard
                icon={GraduationCap}
                title="Learn as You Go"
                description="Every calculator includes Learn Mode that explains what each metric means and why it matters."
                gradient="from-blue-500/20 via-cyan-500/10 to-transparent"
                iconBg="bg-blue-500/10 group-hover:bg-blue-500"
                delay="delay-200"
              />
              <FeatureCard
                icon={TrendingUp}
                title="Market Intelligence"
                description="Get context with rent estimates, neighborhood data, and growth indicators powered by open data."
                gradient="from-emerald-500/20 via-teal-500/10 to-transparent"
                iconBg="bg-emerald-500/10 group-hover:bg-emerald-500"
                delay="delay-300"
              />
            </div>
          </div>
        </section>

        {/* Calculators Preview Section */}
        <section className="border-t py-24 md:py-32">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl headline-premium">
                Professional Calculators
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
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

            <div className="mt-12 text-center">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 hover-lift border-primary/30 hover:border-primary/50 hover:bg-primary/5"
                asChild
              >
                <Link href="/analyze">
                  <BarChart3 className="size-4" />
                  View All Calculators
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section with gradient background */}
        <section className="relative border-t py-24 md:py-32 overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 -z-10 bg-muted/30" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_60%_at_50%_120%,hsl(var(--primary)/0.15),transparent)]" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_40%_40%_at_20%_0%,hsl(var(--brand-300)/0.1),transparent)]" />

          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl headline-premium">
                Ready to Make Better Investment Decisions?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Join thousands of investors using DealForge to analyze deals with confidence.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button size="xl" className="group gap-2 px-10 hover-lift" asChild>
                  <Link href="/sign-up">
                    Create Free Account
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with gradient fade */}
      <footer className="relative border-t py-12">
        {/* Gradient fade at top */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="container">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2.5 group">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
                <Sparkles className="size-4" />
              </div>
              <span className="font-semibold">DealForge</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Open source under AGPL-3.0. Built with Next.js, Rust, and Claude.
            </p>
            <div className="flex gap-6">
              <Link
                href="/docs"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Documentation
              </Link>
              {/* <Link
                href="https://github.com/yourusername/dealforge"
                className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="size-4" />
                GitHub
              </Link> */}
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
  iconBg,
  delay = '',
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
  delay?: string;
}) {
  return (
    <div
      className={`animate-flip-in ${delay} group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all duration-300 hover:border-primary/50 hover-lift`}
    >
      {/* Gradient background on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
      />

      {/* Glass reflection effect at top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative">
        <div
          className={`mb-5 flex size-14 items-center justify-center rounded-xl ${iconBg} text-foreground transition-all duration-300 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg`}
        >
          <Icon className="size-7" />
        </div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
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
      className={`group relative rounded-xl border p-5 transition-all duration-300 overflow-hidden ${
        isAvailable
          ? 'bg-card hover:border-primary/50 cursor-pointer hover-lift'
          : 'bg-muted/20 opacity-50 border-muted'
      }`}
    >
      {/* Glow effect for available */}
      {isAvailable && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      )}

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        </div>
        {isAvailable ? (
          <span className="shrink-0 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success animate-pulse-subtle">
            Available
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            Coming
          </span>
        )}
      </div>

      {/* Bottom accent for available */}
      {isAvailable && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      )}

      {isAvailable && (
        <Link href="/analyze/rental" className="absolute inset-0">
          <span className="sr-only">Open {title} calculator</span>
        </Link>
      )}
    </div>
  );
}
