import Link from 'next/link';

export const metadata = {
  title: 'Analyze',
  description: 'Choose a calculator to analyze your real estate deal',
};

export default function AnalyzePage() {
  return (
    <div className="container py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analyze a Deal</h1>
        <p className="text-muted-foreground">
          Choose the right calculator for your investment strategy.
        </p>
      </div>

      {/* Calculator Grid */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <CalculatorCard
          title="Rental Property"
          description="Analyze cash flow, ROI, cap rate, and cash-on-cash return for buy-and-hold rentals."
          href="/analyze/rental"
          complexity="Beginner"
          available
        />
        <CalculatorCard
          title="BRRRR"
          description="Buy-Rehab-Rent-Refinance-Repeat modeling with refinance projections."
          href="/analyze/brrrr"
          complexity="Beginner"
          available={false}
        />
        <CalculatorCard
          title="Flip/Rehab"
          description="ARV-based profit projections for fix-and-flip investments."
          href="/analyze/flip"
          complexity="Beginner"
          available={false}
        />
        <CalculatorCard
          title="House Hack"
          description="Owner-occupied multi-unit analysis with living cost offsets."
          href="/analyze/house-hack"
          complexity="Beginner"
          available={false}
        />
        <CalculatorCard
          title="Multi-family"
          description="5-50 unit analysis with NOI, DSCR, and expense ratio calculations."
          href="/analyze/multifamily"
          complexity="Intermediate"
          available={false}
        />
        <CalculatorCard
          title="Syndication"
          description="Waterfall distributions, LP/GP splits, IRR, and equity multiple modeling."
          href="/analyze/syndication"
          complexity="Advanced"
          available={false}
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
}: {
  title: string;
  description: string;
  href: string;
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  available: boolean;
}) {
  const complexityColors = {
    Beginner: 'bg-green-100 text-green-800',
    Intermediate: 'bg-yellow-100 text-yellow-800',
    Advanced: 'bg-red-100 text-red-800',
  };

  const content = (
    <div
      className={`rounded-lg border p-6 transition-colors ${
        available ? 'hover:border-primary hover:bg-muted/50' : 'opacity-60'
      }`}
    >
      <div className="flex items-start justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className={`rounded-full px-2 py-1 text-xs ${complexityColors[complexity]}`}>
          {complexity}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {!available && <p className="mt-3 text-xs font-medium text-muted-foreground">Coming soon</p>}
    </div>
  );

  if (available) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
