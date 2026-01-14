import { RentalCalculator } from '@/components/calculators/rental/rental-calculator';

export const metadata = {
  title: 'Rental Property Calculator',
  description: 'Analyze cash flow, ROI, cap rate, and cash-on-cash return for buy-and-hold rentals',
};

export default function RentalCalculatorPage() {
  return (
    <div className="container py-8">
      <RentalCalculator />
    </div>
  );
}
