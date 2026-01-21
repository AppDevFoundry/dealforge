import { calculateMhParkMetrics } from '@/lib/calculations/mh-park';
import { MH_PARK_DEFAULTS } from '@/lib/constants/mh-park-defaults';
import { describe, expect, it } from 'vitest';
import { createMockMhParkInputs } from '../../utils/factories';

describe('calculateMhParkMetrics', () => {
  describe('basic calculations with default inputs', () => {
    it('should calculate occupancy rate correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // 68 occupied / 75 total = 90.67%
      expect(results.occupancyRate).toBeCloseTo(90.67, 1);
    });

    it('should calculate gross potential rent correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // 75 lots × $450/month × 12 = $405,000
      expect(results.grossPotentialRent).toBe(405000);
    });

    it('should calculate vacancy loss correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // (75 - 68) vacant × $450 × 12 = $37,800
      expect(results.vacancyLoss).toBe(37800);
    });

    it('should calculate effective gross income correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // GPR - Vacancy + Other Income
      // 405000 - 37800 + 6000 = 373200
      expect(results.effectiveGrossIncome).toBe(373200);
    });

    it('should calculate total operating expenses correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // EGI × 35% expense ratio = 373200 × 0.35 = 130620
      expect(results.totalOperatingExpenses).toBeCloseTo(130620, 0);
    });

    it('should calculate NOI correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // EGI - Expenses = 373200 - 130620 = 242580
      expect(results.netOperatingIncome).toBe(242580);
    });

    it('should calculate loan amount correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // 2500000 × (1 - 0.25) = 1875000
      expect(results.loanAmount).toBe(1875000);
    });

    it('should calculate total investment correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // Down payment: 2500000 × 0.25 = 625000
      // Closing costs: 2500000 × 0.02 = 50000
      // Total: 675000
      expect(results.totalInvestment).toBe(675000);
    });
  });

  describe('edge cases', () => {
    it('should handle zero lot count', () => {
      const inputs = createMockMhParkInputs({ lotCount: 0, occupiedLots: 0 });
      const results = calculateMhParkMetrics(inputs);

      expect(results.occupancyRate).toBe(0);
      expect(results.grossPotentialRent).toBe(0);
      expect(results.noiPerLot).toBe(0);
      expect(results.pricePerLot).toBe(0);
    });

    it('should handle zero purchase price', () => {
      const inputs = createMockMhParkInputs({ purchasePrice: 0 });
      const results = calculateMhParkMetrics(inputs);

      expect(results.loanAmount).toBe(0);
      expect(results.monthlyDebtService).toBe(0);
      expect(results.capRate).toBe(0);
    });

    it('should handle 100% down payment (no loan)', () => {
      const inputs = createMockMhParkInputs({ downPaymentPercent: 100 });
      const results = calculateMhParkMetrics(inputs);

      expect(results.loanAmount).toBe(0);
      expect(results.monthlyDebtService).toBe(0);
      expect(results.annualDebtService).toBe(0);
      expect(results.debtServiceCoverageRatio).toBe(0);
    });

    it('should handle zero interest rate', () => {
      const inputs = createMockMhParkInputs({ interestRate: 0 });
      const results = calculateMhParkMetrics(inputs);

      // With 0% interest, monthly payment = principal / number of payments
      // 1875000 / 240 = 7812.50
      expect(results.monthlyDebtService).toBeCloseTo(1875000 / 240, 0);
    });

    it('should handle 100% occupancy', () => {
      const inputs = createMockMhParkInputs({
        lotCount: 50,
        occupiedLots: 50,
      });
      const results = calculateMhParkMetrics(inputs);

      expect(results.occupancyRate).toBe(100);
      expect(results.vacancyLoss).toBe(0);
    });

    it('should handle zero occupancy', () => {
      const inputs = createMockMhParkInputs({
        lotCount: 50,
        occupiedLots: 0,
      });
      const results = calculateMhParkMetrics(inputs);

      expect(results.occupancyRate).toBe(0);
      // Vacancy loss should equal GPR (all lots vacant)
      expect(results.vacancyLoss).toBe(results.grossPotentialRent);
    });

    it('should handle zero market cap rate', () => {
      const inputs = createMockMhParkInputs({ marketCapRate: 0 });
      const results = calculateMhParkMetrics(inputs);

      expect(results.estimatedMarketValue).toBe(0);
    });
  });

  describe('income calculations', () => {
    it('should calculate other income annually', () => {
      const inputs = createMockMhParkInputs({
        otherIncomeMonthly: 1000,
      });
      const results = calculateMhParkMetrics(inputs);

      expect(results.otherIncomeAnnual).toBe(12000);
    });

    it('should include other income in EGI', () => {
      const inputs = createMockMhParkInputs({
        lotCount: 10,
        occupiedLots: 10,
        avgLotRent: 500,
        otherIncomeMonthly: 500,
      });
      const results = calculateMhParkMetrics(inputs);

      // GPR: 10 × 500 × 12 = 60000
      // Vacancy: 0
      // Other: 500 × 12 = 6000
      // EGI: 60000 + 6000 = 66000
      expect(results.effectiveGrossIncome).toBe(66000);
    });
  });

  describe('expense calculations', () => {
    it('should apply expense ratio to EGI', () => {
      const inputs = createMockMhParkInputs({
        lotCount: 100,
        occupiedLots: 100,
        avgLotRent: 500,
        otherIncomeMonthly: 0,
        expenseRatioPercent: 40,
      });
      const results = calculateMhParkMetrics(inputs);

      // EGI = 100 × 500 × 12 = 600000
      // Expenses = 600000 × 0.40 = 240000
      expect(results.totalOperatingExpenses).toBe(240000);
    });

    it('should handle zero expense ratio', () => {
      const inputs = createMockMhParkInputs({ expenseRatioPercent: 0 });
      const results = calculateMhParkMetrics(inputs);

      expect(results.totalOperatingExpenses).toBe(0);
      expect(results.netOperatingIncome).toBe(results.effectiveGrossIncome);
    });
  });

  describe('key financial metrics', () => {
    it('should calculate cap rate correctly', () => {
      const inputs = createMockMhParkInputs({
        lotCount: 100,
        occupiedLots: 100,
        avgLotRent: 500,
        otherIncomeMonthly: 0,
        expenseRatioPercent: 40,
        purchasePrice: 1000000,
      });
      const results = calculateMhParkMetrics(inputs);

      // NOI = 600000 × (1 - 0.40) = 360000
      // Cap Rate = 360000 / 1000000 × 100 = 36%
      expect(results.capRate).toBeCloseTo(36, 1);
    });

    it('should calculate cash on cash return correctly', () => {
      const inputs = createMockMhParkInputs({
        purchasePrice: 1000000,
        downPaymentPercent: 25,
        closingCostsPercent: 0,
      });
      const results = calculateMhParkMetrics(inputs);

      // Total investment = 250000
      expect(results.totalInvestment).toBe(250000);
      // Cash on cash = annual cash flow / total investment × 100
      const expectedCOC = (results.annualCashFlow / results.totalInvestment) * 100;
      expect(results.cashOnCashReturn).toBeCloseTo(expectedCOC, 2);
    });

    it('should calculate DSCR correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // DSCR = NOI / Annual Debt Service
      if (results.annualDebtService > 0) {
        const expectedDSCR = results.netOperatingIncome / results.annualDebtService;
        expect(results.debtServiceCoverageRatio).toBeCloseTo(expectedDSCR, 2);
      }
    });

    it('should return 0 cash on cash when investment is 0', () => {
      const inputs = createMockMhParkInputs({
        downPaymentPercent: 0,
        closingCostsPercent: 0,
      });
      const results = calculateMhParkMetrics(inputs);

      expect(results.totalInvestment).toBe(0);
      expect(results.cashOnCashReturn).toBe(0);
    });
  });

  describe('cash flow calculations', () => {
    it('should calculate monthly cash flow correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // Monthly cash flow = Annual cash flow / 12
      expect(results.monthlyCashFlow).toBeCloseTo(results.annualCashFlow / 12, 2);
    });

    it('should calculate annual cash flow correctly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      // Annual cash flow = NOI - Annual Debt Service
      expect(results.annualCashFlow).toBeCloseTo(
        results.netOperatingIncome - results.annualDebtService,
        2
      );
    });

    it('should handle negative cash flow scenarios', () => {
      const inputs = createMockMhParkInputs({
        avgLotRent: 100, // Very low rent
        purchasePrice: 5000000, // High price
        downPaymentPercent: 10, // Low down payment = high mortgage
      });
      const results = calculateMhParkMetrics(inputs);

      // Should result in negative cash flow
      expect(results.monthlyCashFlow).toBeLessThan(0);
      expect(results.annualCashFlow).toBeLessThan(0);
      expect(results.cashOnCashReturn).toBeLessThan(0);
    });
  });

  describe('valuation metrics', () => {
    it('should calculate price per lot correctly', () => {
      const inputs = createMockMhParkInputs({
        lotCount: 50,
        purchasePrice: 1500000,
      });
      const results = calculateMhParkMetrics(inputs);

      // 1500000 / 50 = 30000
      expect(results.pricePerLot).toBe(30000);
    });

    it('should calculate gross rent multiplier correctly', () => {
      const inputs = createMockMhParkInputs({
        lotCount: 100,
        avgLotRent: 500,
        purchasePrice: 5000000,
      });
      const results = calculateMhParkMetrics(inputs);

      // GPR = 100 × 500 × 12 = 600000
      // GRM = 5000000 / 600000 = 8.33
      expect(results.grossRentMultiplier).toBeCloseTo(8.33, 2);
    });

    it('should calculate estimated market value correctly', () => {
      const inputs = createMockMhParkInputs({
        lotCount: 100,
        occupiedLots: 100,
        avgLotRent: 500,
        otherIncomeMonthly: 0,
        expenseRatioPercent: 40,
        marketCapRate: 8,
      });
      const results = calculateMhParkMetrics(inputs);

      // NOI = 600000 × 0.60 = 360000
      // Market Value = 360000 / 0.08 = 4500000
      expect(results.estimatedMarketValue).toBeCloseTo(4500000, 0);
    });

    it('should handle zero GPR for GRM calculation', () => {
      const inputs = createMockMhParkInputs({
        lotCount: 0,
        avgLotRent: 0,
      });
      const results = calculateMhParkMetrics(inputs);

      expect(results.grossRentMultiplier).toBe(0);
    });
  });

  describe('NOI calculations', () => {
    it('should calculate NOI per lot correctly', () => {
      const inputs = createMockMhParkInputs({
        lotCount: 50,
        occupiedLots: 50,
        avgLotRent: 500,
        otherIncomeMonthly: 0,
        expenseRatioPercent: 30,
      });
      const results = calculateMhParkMetrics(inputs);

      // GPR = 50 × 500 × 12 = 300000
      // NOI = 300000 × 0.70 = 210000
      // NOI per lot = 210000 / 50 = 4200
      expect(results.noiPerLot).toBe(4200);
    });

    it('should not include debt service in NOI', () => {
      // NOI should be the same regardless of financing
      const inputs100Down = createMockMhParkInputs({ downPaymentPercent: 100 });
      const inputs25Down = createMockMhParkInputs({ downPaymentPercent: 25 });

      const results100 = calculateMhParkMetrics(inputs100Down);
      const results25 = calculateMhParkMetrics(inputs25Down);

      // NOI should be the same (financing doesn't affect NOI)
      expect(results100.netOperatingIncome).toBeCloseTo(results25.netOperatingIncome, 2);
    });
  });

  describe('financing calculations', () => {
    it('should calculate down payment correctly', () => {
      const inputs = createMockMhParkInputs({
        purchasePrice: 2000000,
        downPaymentPercent: 30,
      });
      const results = calculateMhParkMetrics(inputs);

      // 2000000 × 0.30 = 600000
      expect(results.downPayment).toBe(600000);
    });

    it('should calculate closing costs correctly', () => {
      const inputs = createMockMhParkInputs({
        purchasePrice: 2000000,
        closingCostsPercent: 3,
      });
      const results = calculateMhParkMetrics(inputs);

      // 2000000 × 0.03 = 60000
      expect(results.closingCosts).toBe(60000);
    });

    it('should calculate annual debt service as 12x monthly', () => {
      const results = calculateMhParkMetrics(MH_PARK_DEFAULTS);

      expect(results.annualDebtService).toBeCloseTo(results.monthlyDebtService * 12, 2);
    });
  });
});
