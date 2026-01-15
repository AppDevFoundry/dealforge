import { calculateRentalMetrics } from '@/lib/calculations/rental';
import { RENTAL_DEFAULTS } from '@/lib/constants/rental-defaults';
import { describe, expect, it } from 'vitest';
import { createMockRentalInputs } from '../../utils/factories';

describe('calculateRentalMetrics', () => {
  describe('basic calculations with default inputs', () => {
    it('should calculate loan amount correctly', () => {
      const results = calculateRentalMetrics(RENTAL_DEFAULTS);

      // 200000 * (1 - 0.20) = 160000
      expect(results.loanAmount).toBe(160000);
    });

    it('should calculate total investment correctly', () => {
      const results = calculateRentalMetrics(RENTAL_DEFAULTS);

      // Down payment: 200000 * 0.20 = 40000
      // Plus closing costs: 4000
      // Plus rehab: 0
      // Total: 44000
      expect(results.totalInvestment).toBe(44000);
    });

    it('should calculate gross monthly income correctly', () => {
      const results = calculateRentalMetrics(RENTAL_DEFAULTS);

      // Monthly rent: 1800 + other income: 0
      expect(results.grossMonthlyIncome).toBe(1800);
    });

    it('should calculate effective gross income with vacancy', () => {
      const results = calculateRentalMetrics(RENTAL_DEFAULTS);

      // Gross: 1800, vacancy: 5%
      // 1800 * 0.95 = 1710
      expect(results.effectiveGrossIncome).toBe(1710);
    });
  });

  describe('edge cases', () => {
    it('should handle zero purchase price', () => {
      const inputs = createMockRentalInputs({ purchasePrice: 0 });
      const results = calculateRentalMetrics(inputs);

      expect(results.loanAmount).toBe(0);
      expect(results.monthlyMortgage).toBe(0);
      expect(results.capRate).toBe(0);
    });

    it('should handle 100% down payment (no loan)', () => {
      const inputs = createMockRentalInputs({ downPaymentPercent: 100 });
      const results = calculateRentalMetrics(inputs);

      expect(results.loanAmount).toBe(0);
      expect(results.monthlyMortgage).toBe(0);
      // DSCR should be 0 when there's no debt service
      expect(results.debtServiceCoverageRatio).toBe(0);
    });

    it('should handle zero interest rate', () => {
      const inputs = createMockRentalInputs({ interestRate: 0 });
      const results = calculateRentalMetrics(inputs);

      // With 0% interest, monthly payment = principal / number of payments
      // 160000 / 360 = ~444.44
      expect(results.monthlyMortgage).toBeCloseTo(160000 / 360, 0);
    });

    it('should handle zero vacancy rate', () => {
      const inputs = createMockRentalInputs({ vacancyRate: 0 });
      const results = calculateRentalMetrics(inputs);

      expect(results.effectiveGrossIncome).toBe(results.grossMonthlyIncome);
    });

    it('should handle high vacancy rate', () => {
      const inputs = createMockRentalInputs({ vacancyRate: 50 });
      const results = calculateRentalMetrics(inputs);

      // 50% vacancy means half the gross income
      expect(results.effectiveGrossIncome).toBe(results.grossMonthlyIncome * 0.5);
    });
  });

  describe('expense calculations', () => {
    it('should calculate monthly property tax', () => {
      const inputs = createMockRentalInputs({
        propertyTaxAnnual: 2400, // $200/month
        insuranceAnnual: 0,
        hoaMonthly: 0,
        maintenancePercent: 0,
        capexPercent: 0,
        managementPercent: 0,
      });
      const results = calculateRentalMetrics(inputs);

      // Only property tax: 2400 / 12 = 200
      expect(results.totalMonthlyExpenses).toBe(200);
    });

    it('should calculate percentage-based expenses from gross income', () => {
      const inputs = createMockRentalInputs({
        monthlyRent: 2000,
        otherIncome: 0,
        propertyTaxAnnual: 0,
        insuranceAnnual: 0,
        hoaMonthly: 0,
        maintenancePercent: 5, // 100
        capexPercent: 5, // 100
        managementPercent: 10, // 200
      });
      const results = calculateRentalMetrics(inputs);

      // 5% + 5% + 10% of 2000 = 400
      expect(results.totalMonthlyExpenses).toBe(400);
    });

    it('should include HOA in expenses', () => {
      const inputs = createMockRentalInputs({
        propertyTaxAnnual: 0,
        insuranceAnnual: 0,
        hoaMonthly: 250,
        maintenancePercent: 0,
        capexPercent: 0,
        managementPercent: 0,
      });
      const results = calculateRentalMetrics(inputs);

      expect(results.totalMonthlyExpenses).toBe(250);
    });
  });

  describe('key financial metrics', () => {
    it('should calculate cap rate correctly', () => {
      const inputs = createMockRentalInputs({
        purchasePrice: 100000,
        monthlyRent: 1000,
        otherIncome: 0,
        vacancyRate: 0,
        propertyTaxAnnual: 1200, // $100/month
        insuranceAnnual: 600, // $50/month
        hoaMonthly: 0,
        maintenancePercent: 0,
        capexPercent: 0,
        managementPercent: 0,
      });
      const results = calculateRentalMetrics(inputs);

      // NOI = (1000 - 100 - 50) * 12 = 10,200
      // Cap Rate = 10200 / 100000 = 10.2%
      expect(results.capRate).toBeCloseTo(10.2, 1);
    });

    it('should calculate cash on cash return correctly', () => {
      const inputs = createMockRentalInputs({
        purchasePrice: 100000,
        downPaymentPercent: 20,
        closingCosts: 0,
        rehabCosts: 0,
      });
      const results = calculateRentalMetrics(inputs);

      // Total investment = 20000
      expect(results.totalInvestment).toBe(20000);
      // Cash on cash = annual cash flow / total investment * 100
      const expectedCOC = (results.annualCashFlow / results.totalInvestment) * 100;
      expect(results.cashOnCashReturn).toBeCloseTo(expectedCOC, 2);
    });

    it('should calculate DSCR correctly', () => {
      const results = calculateRentalMetrics(RENTAL_DEFAULTS);

      // DSCR = NOI / Annual Debt Service
      const expectedDSCR = results.netOperatingIncome / (results.monthlyMortgage * 12);
      expect(results.debtServiceCoverageRatio).toBeCloseTo(expectedDSCR, 2);
    });

    it('should return 0 cash on cash when investment is 0', () => {
      const inputs = createMockRentalInputs({
        downPaymentPercent: 0,
        closingCosts: 0,
        rehabCosts: 0,
      });
      const results = calculateRentalMetrics(inputs);

      expect(results.totalInvestment).toBe(0);
      expect(results.cashOnCashReturn).toBe(0);
    });
  });

  describe('cash flow calculations', () => {
    it('should calculate monthly cash flow correctly', () => {
      const results = calculateRentalMetrics(RENTAL_DEFAULTS);

      // Cash flow = Effective Gross Income - Operating Expenses - Mortgage
      const expectedCashFlow = results.effectiveGrossIncome - results.totalMonthlyExpenses - results.monthlyMortgage;
      expect(results.monthlyCashFlow).toBeCloseTo(expectedCashFlow, 2);
    });

    it('should calculate annual cash flow as 12x monthly', () => {
      const results = calculateRentalMetrics(RENTAL_DEFAULTS);

      expect(results.annualCashFlow).toBeCloseTo(results.monthlyCashFlow * 12, 2);
    });

    it('should handle negative cash flow scenarios', () => {
      const inputs = createMockRentalInputs({
        monthlyRent: 500, // Very low rent
        purchasePrice: 300000, // High price
        downPaymentPercent: 5, // Low down payment = high mortgage
      });
      const results = calculateRentalMetrics(inputs);

      // Should result in negative cash flow
      expect(results.monthlyCashFlow).toBeLessThan(0);
      expect(results.annualCashFlow).toBeLessThan(0);
      expect(results.cashOnCashReturn).toBeLessThan(0);
    });
  });

  describe('amortization calculations', () => {
    it('should calculate year 1 principal paydown', () => {
      const results = calculateRentalMetrics(RENTAL_DEFAULTS);

      // Should be positive for a loan with payments
      expect(results.year1PrincipalPaydown).toBeGreaterThan(0);
      // Should be less than total payments (since most goes to interest early)
      expect(results.year1PrincipalPaydown).toBeLessThan(results.monthlyMortgage * 12);
    });

    it('should calculate year 1 interest paid', () => {
      const results = calculateRentalMetrics(RENTAL_DEFAULTS);

      // Interest should be positive
      expect(results.year1InterestPaid).toBeGreaterThan(0);
      // Principal + Interest = Total payments (approximately)
      const totalYear1Payments = results.monthlyMortgage * 12;
      expect(results.year1PrincipalPaydown + results.year1InterestPaid).toBeCloseTo(totalYear1Payments, 0);
    });

    it('should return 0 amortization when no loan', () => {
      const inputs = createMockRentalInputs({ downPaymentPercent: 100 });
      const results = calculateRentalMetrics(inputs);

      expect(results.year1PrincipalPaydown).toBe(0);
      expect(results.year1InterestPaid).toBe(0);
    });
  });

  describe('5-year projections', () => {
    it('should calculate 5-year equity', () => {
      const results = calculateRentalMetrics(RENTAL_DEFAULTS);

      // 5-year equity = down payment + 5 years of principal paydown
      // Should be greater than just the down payment
      const downPayment = RENTAL_DEFAULTS.purchasePrice * (RENTAL_DEFAULTS.downPaymentPercent / 100);
      expect(results.fiveYearEquity).toBeGreaterThan(downPayment);
    });

    it('should calculate 5-year total return', () => {
      const results = calculateRentalMetrics(RENTAL_DEFAULTS);

      // Should be defined and positive for a cash-flowing property
      expect(results.fiveYearTotalReturn).toBeDefined();
      expect(results.fiveYearTotalReturn).toBeGreaterThan(0);
    });

    it('should return 0 five-year return when investment is 0', () => {
      const inputs = createMockRentalInputs({
        downPaymentPercent: 0,
        closingCosts: 0,
        rehabCosts: 0,
      });
      const results = calculateRentalMetrics(inputs);

      expect(results.fiveYearTotalReturn).toBe(0);
    });
  });

  describe('NOI calculations', () => {
    it('should calculate net operating income correctly', () => {
      const results = calculateRentalMetrics(RENTAL_DEFAULTS);

      // NOI = (Effective Gross Income - Operating Expenses) * 12
      const expectedNOI = (results.effectiveGrossIncome - results.totalMonthlyExpenses) * 12;
      expect(results.netOperatingIncome).toBeCloseTo(expectedNOI, 2);
    });

    it('should not include mortgage in NOI', () => {
      // NOI should be the same regardless of financing
      const inputs100Down = createMockRentalInputs({ downPaymentPercent: 100 });
      const inputs20Down = createMockRentalInputs({ downPaymentPercent: 20 });

      const results100 = calculateRentalMetrics(inputs100Down);
      const results20 = calculateRentalMetrics(inputs20Down);

      // NOI should be the same (mortgage doesn't affect NOI)
      expect(results100.netOperatingIncome).toBeCloseTo(results20.netOperatingIncome, 2);
    });
  });

  describe('total ROI', () => {
    it('should calculate total ROI as annualized 5-year return', () => {
      const results = calculateRentalMetrics(RENTAL_DEFAULTS);

      // Total ROI = 5-year return / 5
      expect(results.totalRoi).toBeCloseTo(results.fiveYearTotalReturn / 5, 2);
    });
  });
});
