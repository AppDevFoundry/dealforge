import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Analyze',
  description: 'Choose a calculator to analyze your real estate deal',
};

export default function AnalyzePage() {
  return (
    <div className="container py-8">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight headline-premium">Analyze a Deal</h1>
        <p className="text-muted-foreground mt-1">
          Choose the right calculator for your investment strategy.
        </p>
      </div>

      {/* Calculator Grid with staggered animations */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <CalculatorCard
          title="Rental Property"
          description="Analyze cash flow, ROI, cap rate, and cash-on-cash return for buy-and-hold rentals."
          href="/analyze/rental"
          complexity="Beginner"
          available
          delay="delay-100"
          isNew
        />
        <CalculatorCard
          title="BRRRR"
          description="Buy-Rehab-Rent-Refinance-Repeat modeling with refinance projections."
          href="/analyze/brrrr"
          complexity="Beginner"
          available
          delay="delay-150"
          isNew
        />
        <CalculatorCard
          title="Flip/Rehab"
          description="ARV-based profit projections for fix-and-flip investments."
          href="/analyze/flip"
          complexity="Beginner"
          available
          delay="delay-200"
          isNew
        />
        <CalculatorCard
          title="House Hack"
          description="Owner-occupied multi-unit analysis with living cost offsets."
          href="/analyze/house-hack"
          complexity="Beginner"
          available
          delay="delay-300"
          isNew
        />
        <CalculatorCard
          title="Multi-family"
          description="5-50 unit analysis with NOI, DSCR, and expense ratio calculations."
          href="/analyze/multifamily"
          complexity="Intermediate"
          available
          delay="delay-400"
          isNew
        />
        <CalculatorCard
          title="Syndication"
          description="Waterfall distributions, LP/GP splits, IRR, and equity multiple modeling."
          href="/analyze/syndication"
          complexity="Advanced"
          available
          delay="delay-500"
          isNew
        />
      </div>
    </div>
  );
}

function CalculatorCard({
  title,
  description,
  href,
  complexity,
  available,
  delay = '',
  isNew = false,
}: {
  title: string;
  description: string;
  href: string;
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  available: boolean;
  delay?: string;
  isNew?: boolean;
}) {
  // Use semantic color tokens instead of hardcoded colors
  const complexityStyles = {
    Beginner: 'bg-success/10 text-success dark:bg-success/20 dark:text-green-400',
    Intermediate: 'bg-warning/10 text-warning dark:bg-warning/20 dark:text-yellow-400',
    Advanced: 'bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-red-400',
  };

  const content = (
    <div
      className={`
        animate-flip-in ${delay}
        rounded-xl border p-6 transition-all duration-300 group relative overflow-hidden
        ${available ? 'card-premium cursor-pointer' : 'bg-muted/30 opacity-60 border-muted'}
      `}
    >
      {/* Glow effect for available cards */}
      {available && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
      )}

      {/* NEW badge for featured calculators */}
      {isNew && available && (
        <div className="absolute -right-8 top-3 rotate-45 bg-primary px-8 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-lg">
          New
        </div>
      )}

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-lg">{title}</h3>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${complexityStyles[complexity]}`}
          >
            {complexity}
          </span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{description}</p>

        {available ? (
          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
            <Sparkles className="size-4" />
            <span>Start Analysis</span>
            <ArrowRight className="size-4" />
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <div className="size-2 rounded-full bg-muted-foreground/50" />
            <span>Coming soon</span>
          </div>
        )}
      </div>

      {/* Bottom gradient accent for available cards */}
      {available && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </div>
  );

  if (available) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
