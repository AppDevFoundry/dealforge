import { calculateMhParkMetrics } from '@/lib/calculations/mh-park';
import { MH_PARK_DEFAULTS } from '@/lib/constants/mh-park-defaults';
import { describe, expect, it } from 'vitest';
import { createMockMhParkInputs } from '../../utils/factories';

describe('calculateMhParkMetrics', () => {
  describe('income calculations', () => {
    it('should calculate gross potential income correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // 50 lots * $350 rent * 12 months = $210,000
      expect(results.grossPotentialIncome).toBe(210000);
    });

    it('should calculate vacancy loss correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // GPI * (1 - 85/100) = 210000 * 0.15 = 31500
      expect(results.vacancyLoss).toBeCloseTo(31500, 2);
    });

    it('should calculate effective gross income correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // GPI - Vacancy = 210000 - 31500 = 178500
      expect(results.effectiveGrossIncome).toBe(178500);
    });

    it('should scale with lot count', () => {
      const inputs25 = createMockMhParkInputs({ lotCount: 25 });
      const inputs100 = createMockMhParkInputs({ lotCount: 100 });

      const results25 = calculateMhParkMetrics(inputs25);
      const results100 = calculateMhParkMetrics(inputs100);

      // 4x lots = 4x GPI
      expect(results100.grossPotentialIncome).toBe(results25.grossPotentialIncome * 4);
    });

    it('should scale with average lot rent', () => {
      const inputs = createMockMhParkInputs({ averageLotRent: 500 });
      const results = calculateMhParkMetrics(inputs);

      // 50 lots * $500 * 12 = $300,000
      expect(results.grossPotentialIncome).toBe(300000);
    });
  });

  describe('expense calculations', () => {
    it('should calculate operating expenses correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // EGI * (35/100) = 178500 * 0.35 = 62475
      expect(results.totalOperatingExpenses).toBeCloseTo(62475, 2);
    });

    it('should calculate NOI correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // EGI - Expenses = 178500 - 62475 = 116025
      expect(results.netOperatingIncome).toBe(116025);
    });

    it('should handle 0% expense ratio', () => {
      const inputs = createMockMhParkInputs({ expenseRatio: 0 });
      const results = calculateMhParkMetrics(inputs);

      expect(results.totalOperatingExpenses).toBe(0);
      expect(results.netOperatingIncome).toBe(results.effectiveGrossIncome);
    });

    it('should handle 100% expense ratio', () => {
      const inputs = createMockMhParkInputs({ expenseRatio: 100 });
      const results = calculateMhParkMetrics(inputs);

      expect(results.totalOperatingExpenses).toBe(results.effectiveGrossIncome);
      expect(results.netOperatingIncome).toBe(0);
    });
  });

  describe('cap rate', () => {
    it('should calculate cap rate correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // NOI / Purchase Price * 100 = 116025 / 1500000 * 100 = 7.735%
      expect(results.capRate).toBeCloseTo(7.735, 2);
    });

    it('should return 0 cap rate when purchase price is 0', () => {
      const inputs = createMockMhParkInputs({ purchasePrice: 0 });
      const results = calculateMhParkMetrics(inputs);

      expect(results.capRate).toBe(0);
    });

    it('should be independent of financing terms', () => {
      const inputs25Down = createMockMhParkInputs({ downPaymentPercent: 25 });
      const inputs50Down = createMockMhParkInputs({ downPaymentPercent: 50 });

      const results25 = calculateMhParkMetrics(inputs25Down);
      const results50 = calculateMhParkMetrics(inputs50Down);

      expect(results25.capRate).toBeCloseTo(results50.capRate, 2);
    });
  });

  describe('financing calculations', () => {
    it('should calculate loan amount correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // 1500000 * (1 - 25/100) = 1125000
      expect(results.loanAmount).toBe(1125000);
    });

    it('should calculate total investment (down payment) correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // 1500000 * (25/100) = 375000
      expect(results.totalInvestment).toBe(375000);
    });

    it('should calculate monthly debt service correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // Standard amortization formula with 7% rate, 25 year amortization
      // Should be a positive number greater than principal-only payment
      expect(results.monthlyDebtService).toBeGreaterThan(0);
      expect(results.monthlyDebtService).toBeGreaterThan(results.loanAmount / (25 * 12));
    });

    it('should calculate annual debt service as 12x monthly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      expect(results.annualDebtService).toBeCloseTo(results.monthlyDebtService * 12, 2);
    });

    it('should handle 100% down payment (no loan)', () => {
      const inputs = createMockMhParkInputs({ downPaymentPercent: 100 });
      const results = calculateMhParkMetrics(inputs);

      expect(results.loanAmount).toBe(0);
      expect(results.monthlyDebtService).toBe(0);
      expect(results.annualDebtService).toBe(0);
    });

    it('should handle 0% interest rate', () => {
      const inputs = createMockMhParkInputs({ interestRate: 0 });
      const results = calculateMhParkMetrics(inputs);

      // With 0% interest, monthly payment = principal / number of payments
      const expectedPayment = inputs.purchasePrice * (1 - inputs.downPaymentPercent / 100) / (inputs.amortizationYears * 12);
      expect(results.monthlyDebtService).toBeCloseTo(expectedPayment, 2);
    });

    it('should handle 0% down payment', () => {
      const inputs = createMockMhParkInputs({ downPaymentPercent: 0 });
      const results = calculateMhParkMetrics(inputs);

      expect(results.loanAmount).toBe(inputs.purchasePrice);
      expect(results.totalInvestment).toBe(0);
    });
  });

  describe('cash flow calculations', () => {
    it('should calculate annual cash flow correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // NOI - Annual Debt Service
      const expectedAnnualCashFlow = results.netOperatingIncome - results.annualDebtService;
      expect(results.annualCashFlow).toBeCloseTo(expectedAnnualCashFlow, 2);
    });

    it('should calculate monthly cash flow as annual / 12', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      expect(results.monthlyCashFlow).toBeCloseTo(results.annualCashFlow / 12, 2);
    });

    it('should handle negative cash flow', () => {
      const inputs = createMockMhParkInputs({
        lotCount: 10,
        averageLotRent: 200,
        purchasePrice: 2000000,
        downPaymentPercent: 10,
      });
      const results = calculateMhParkMetrics(inputs);

      expect(results.annualCashFlow).toBeLessThan(0);
      expect(results.monthlyCashFlow).toBeLessThan(0);
    });

    it('should have higher cash flow with all-cash purchase', () => {
      const inputsLevered = createMockMhParkInputs({ downPaymentPercent: 25 });
      const inputsAllCash = createMockMhParkInputs({ downPaymentPercent: 100 });

      const resultsLevered = calculateMhParkMetrics(inputsLevered);
      const resultsAllCash = calculateMhParkMetrics(inputsAllCash);

      expect(resultsAllCash.annualCashFlow).toBeGreaterThan(resultsLevered.annualCashFlow);
    });
  });

  describe('return metrics', () => {
    it('should calculate cash on cash return correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // Annual Cash Flow / Total Investment * 100
      const expectedCoC = (results.annualCashFlow / results.totalInvestment) * 100;
      expect(results.cashOnCashReturn).toBeCloseTo(expectedCoC, 2);
    });

    it('should return 0 cash on cash when investment is 0', () => {
      const inputs = createMockMhParkInputs({ downPaymentPercent: 0 });
      const results = calculateMhParkMetrics(inputs);

      expect(results.totalInvestment).toBe(0);
      expect(results.cashOnCashReturn).toBe(0);
    });

    it('should return negative CoC when cash flow is negative', () => {
      const inputs = createMockMhParkInputs({
        lotCount: 10,
        averageLotRent: 200,
        purchasePrice: 2000000,
        downPaymentPercent: 25,
      });
      const results = calculateMhParkMetrics(inputs);

      expect(results.cashOnCashReturn).toBeLessThan(0);
    });
  });

  describe('coverage ratio', () => {
    it('should calculate DSCR correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // DSCR = NOI / Annual Debt Service
      const expectedDSCR = results.netOperatingIncome / results.annualDebtService;
      expect(results.debtServiceCoverageRatio).toBeCloseTo(expectedDSCR, 2);
    });

    it('should return 0 DSCR when no debt service', () => {
      const inputs = createMockMhParkInputs({ downPaymentPercent: 100 });
      const results = calculateMhParkMetrics(inputs);

      expect(results.debtServiceCoverageRatio).toBe(0);
    });

    it('should have DSCR > 1 for healthy deals', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // Default inputs should produce a healthy DSCR
      expect(results.debtServiceCoverageRatio).toBeGreaterThan(1);
    });

    it('should have DSCR < 1 for over-leveraged deals', () => {
      const inputs = createMockMhParkInputs({
        lotCount: 20,
        averageLotRent: 250,
        purchasePrice: 2000000,
        downPaymentPercent: 5,
        interestRate: 10,
      });
      const results = calculateMhParkMetrics(inputs);

      expect(results.debtServiceCoverageRatio).toBeLessThan(1);
    });
  });

  describe('per-lot metrics', () => {
    it('should calculate NOI per lot correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // NOI / lotCount = 116025 / 50 = 2320.5
      expect(results.noiPerLot).toBeCloseTo(results.netOperatingIncome / 50, 2);
    });

    it('should calculate price per lot correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // 1500000 / 50 = 30000
      expect(results.pricePerLot).toBe(30000);
    });

    it('should handle 0 lot count', () => {
      const inputs = createMockMhParkInputs({ lotCount: 0 });
      const results = calculateMhParkMetrics(inputs);

      expect(results.noiPerLot).toBe(0);
      expect(results.pricePerLot).toBe(0);
    });

    it('should scale inversely with lot count', () => {
      const inputs50 = createMockMhParkInputs({ lotCount: 50 });
      const inputs100 = createMockMhParkInputs({ lotCount: 100 });

      const results50 = calculateMhParkMetrics(inputs50);
      const results100 = calculateMhParkMetrics(inputs100);

      // Same purchase price, double the lots = half the price per lot
      expect(results100.pricePerLot).toBeCloseTo(results50.pricePerLot / 2, 2);
    });
  });

  describe('edge cases', () => {
    it('should handle 100% occupancy', () => {
      const inputs = createMockMhParkInputs({ occupancyRate: 100 });
      const results = calculateMhParkMetrics(inputs);

      expect(results.vacancyLoss).toBe(0);
      expect(results.effectiveGrossIncome).toBe(results.grossPotentialIncome);
    });

    it('should handle 0% occupancy', () => {
      const inputs = createMockMhParkInputs({ occupancyRate: 0 });
      const results = calculateMhParkMetrics(inputs);

      expect(results.vacancyLoss).toBe(results.grossPotentialIncome);
      expect(results.effectiveGrossIncome).toBe(0);
      expect(results.netOperatingIncome).toBe(0);
    });

    it('should handle very large parks', () => {
      const inputs = createMockMhParkInputs({
        lotCount: 500,
        averageLotRent: 600,
        purchasePrice: 50000000,
      });
      const results = calculateMhParkMetrics(inputs);

      // 500 * 600 * 12 = 3,600,000 GPI
      expect(results.grossPotentialIncome).toBe(3600000);
      expect(results.pricePerLot).toBe(100000);
    });

    it('should handle very small parks', () => {
      const inputs = createMockMhParkInputs({
        lotCount: 5,
        averageLotRent: 300,
        purchasePrice: 200000,
      });
      const results = calculateMhParkMetrics(inputs);

      // 5 * 300 * 12 = 18000 GPI
      expect(results.grossPotentialIncome).toBe(18000);
      expect(results.pricePerLot).toBe(40000);
    });

    it('should produce consistent results across all metrics', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // Verify the chain of calculations is consistent
      expect(results.effectiveGrossIncome).toBe(results.grossPotentialIncome - results.vacancyLoss);
      expect(results.netOperatingIncome).toBeCloseTo(
        results.effectiveGrossIncome - results.totalOperatingExpenses,
        2
      );
      expect(results.annualCashFlow).toBeCloseTo(
        results.netOperatingIncome - results.annualDebtService,
        2
      );
      expect(results.loanAmount + results.totalInvestment).toBe(MH_PARK_DEFAULTS.purchasePrice);
    });
  });
});
