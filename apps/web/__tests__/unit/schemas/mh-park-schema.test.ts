import { mhParkInputSchema } from '@/components/calculators/mh-park/mh-park-schema';
import { MH_PARK_DEFAULTS } from '@/lib/constants/mh-park-defaults';
import { describe, expect, it } from 'vitest';

describe('mhParkInputSchema', () => {
  describe('valid inputs', () => {
    it('should accept default values', () => {
      const result = mhParkInputSchema.safeParse(MH_PARK_DEFAULTS);
      expect(result.success).toBe(true);
    });

    it('should accept minimum valid values', () => {
      const result = mhParkInputSchema.safeParse({
        lotCount: 1,
        averageLotRent: 1,
        occupancyRate: 0,
        expenseRatio: 0,
        purchasePrice: 1,
        downPaymentPercent: 0,
        interestRate: 0,
        loanTermYears: 1,
        amortizationYears: 1,
      });
      expect(result.success).toBe(true);
    });

    it('should accept maximum valid values', () => {
      const result = mhParkInputSchema.safeParse({
        lotCount: 2000,
        averageLotRent: 5000,
        occupancyRate: 100,
        expenseRatio: 100,
        purchasePrice: 500000000,
        downPaymentPercent: 100,
        interestRate: 30,
        loanTermYears: 40,
        amortizationYears: 40,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('lotCount validation', () => {
    it('should reject 0 lots', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, lotCount: 0 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Must have at least 1 lot');
      }
    });

    it('should reject negative lots', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, lotCount: -10 });
      expect(result.success).toBe(false);
    });

    it('should reject lots over 2000', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, lotCount: 2001 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Lot count too high');
      }
    });

    it('should reject non-numeric lot count', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, lotCount: 'abc' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Must be a number');
      }
    });
  });

  describe('averageLotRent validation', () => {
    it('should reject 0 rent', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, averageLotRent: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject rent over 5000', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, averageLotRent: 5001 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Rent too high');
      }
    });
  });

  describe('occupancyRate validation', () => {
    it('should accept 0% occupancy', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, occupancyRate: 0 });
      expect(result.success).toBe(true);
    });

    it('should accept 100% occupancy', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, occupancyRate: 100 });
      expect(result.success).toBe(true);
    });

    it('should reject negative occupancy', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, occupancyRate: -1 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Cannot be negative');
      }
    });

    it('should reject occupancy over 100%', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, occupancyRate: 101 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Cannot exceed 100%');
      }
    });
  });

  describe('expenseRatio validation', () => {
    it('should accept 0% expense ratio', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, expenseRatio: 0 });
      expect(result.success).toBe(true);
    });

    it('should reject negative expense ratio', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, expenseRatio: -5 });
      expect(result.success).toBe(false);
    });

    it('should reject expense ratio over 100%', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, expenseRatio: 101 });
      expect(result.success).toBe(false);
    });
  });

  describe('purchasePrice validation', () => {
    it('should reject 0 purchase price', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, purchasePrice: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject price over 500M', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, purchasePrice: 500000001 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Purchase price too high');
      }
    });
  });

  describe('financing validation', () => {
    it('should accept 0% down payment', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, downPaymentPercent: 0 });
      expect(result.success).toBe(true);
    });

    it('should reject down payment over 100%', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, downPaymentPercent: 101 });
      expect(result.success).toBe(false);
    });

    it('should accept 0% interest rate', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, interestRate: 0 });
      expect(result.success).toBe(true);
    });

    it('should reject interest rate over 30%', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, interestRate: 31 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Rate too high');
      }
    });

    it('should reject loan term of 0 years', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, loanTermYears: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject loan term over 40 years', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, loanTermYears: 41 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Term too long');
      }
    });

    it('should reject amortization of 0 years', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, amortizationYears: 0 });
      expect(result.success).toBe(false);
    });

    it('should reject amortization over 40 years', () => {
      const result = mhParkInputSchema.safeParse({ ...MH_PARK_DEFAULTS, amortizationYears: 41 });
      expect(result.success).toBe(false);
    });
  });

  describe('missing fields', () => {
    it('should reject empty object', () => {
      const result = mhParkInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject partial input', () => {
      const result = mhParkInputSchema.safeParse({
        lotCount: 50,
        averageLotRent: 350,
      });
      expect(result.success).toBe(false);
    });
  });
});
