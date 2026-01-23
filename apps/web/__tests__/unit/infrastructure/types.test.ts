import { HIGH_RISK_ZONES } from '@dealforge/types';
import { describe, expect, it } from 'vitest';

describe('HIGH_RISK_ZONES', () => {
  it('should contain all FEMA high-risk zone codes', () => {
    expect(HIGH_RISK_ZONES).toContain('A');
    expect(HIGH_RISK_ZONES).toContain('AE');
    expect(HIGH_RISK_ZONES).toContain('AH');
    expect(HIGH_RISK_ZONES).toContain('AO');
    expect(HIGH_RISK_ZONES).toContain('AR');
    expect(HIGH_RISK_ZONES).toContain('A99');
    expect(HIGH_RISK_ZONES).toContain('V');
    expect(HIGH_RISK_ZONES).toContain('VE');
  });

  it('should not contain low-risk zones', () => {
    expect(HIGH_RISK_ZONES).not.toContain('X');
  });

  it('should not contain undetermined zones', () => {
    expect(HIGH_RISK_ZONES).not.toContain('D');
  });

  it('should have exactly 8 high-risk zone codes', () => {
    expect(HIGH_RISK_ZONES).toHaveLength(8);
  });
});
