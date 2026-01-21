import { MhParkCalculatorWrapper } from '@/components/calculators/mh-park';

export default function MhParksCalculatorPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">MH Park Calculator</h1>
        <p className="text-muted-foreground">
          Analyze potential Mobile Home park investments with detailed cash flow projections
        </p>
      </div>

      <MhParkCalculatorWrapper />
    </div>
  );
}
