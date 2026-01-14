import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">DealForge</span>
          </div>
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/sign-in" className="text-sm font-medium hover:underline">
              Sign In
            </Link>
            <Button asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Forge Better Deals with <span className="text-primary">Data, Not Gut Feelings</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground md:text-xl">
              Open-source, AI-native real estate analysis platform. Analyze rental properties, BRRRR
              deals, flips, and more with institutional-grade tools.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/sign-up">Start Analyzing for Free</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/analyze">Try a Calculator</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-muted/50 py-16">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">Everything You Need</h2>
              <p className="mt-4 text-muted-foreground">
                From your first rental to complex syndications, DealForge grows with you.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <FeatureCard
                title="AI-Native Analysis"
                description="Paste a listing URL and let AI extract the data. Chat about your deal to understand the numbers better."
              />
              <FeatureCard
                title="Learn as You Go"
                description="Every calculator includes Learn Mode that explains what each metric means and why it matters."
              />
              <FeatureCard
                title="Market Intelligence"
                description="Get context with rent estimates, neighborhood data, and growth indicators powered by open data."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            Open source under AGPL-3.0. Built with Next.js, Rust, and Claude.
          </p>
          <div className="flex gap-4">
            <Link href="/docs" className="text-sm text-muted-foreground hover:underline">
              Documentation
            </Link>
            <Link
              href="https://github.com/yourusername/dealforge"
              className="text-sm text-muted-foreground hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
