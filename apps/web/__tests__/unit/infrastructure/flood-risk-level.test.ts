import { getFloodRiskLevel } from '@dealforge/types';
import { describe, expect, it } from 'vitest';

describe('getFloodRiskLevel', () => {
  describe('high risk zones', () => {
    it.each(['A', 'AE', 'AH', 'AO', 'AR', 'A99', 'V', 'VE'])(
      'returns high for base zone code "%s"',
      (code) => {
        expect(getFloodRiskLevel(code)).toBe('high');
      }
    );

    it('returns high for "AE FLOODWAY" (zone with subtype)', () => {
      expect(getFloodRiskLevel('AE FLOODWAY')).toBe('high');
    });

    it('returns high for "A STATIC" (zone with subtype)', () => {
      expect(getFloodRiskLevel('A STATIC')).toBe('high');
    });

    it('returns high for "VE COASTAL" (zone with subtype)', () => {
      expect(getFloodRiskLevel('VE COASTAL')).toBe('high');
    });

    it('returns high for lowercase input', () => {
      expect(getFloodRiskLevel('ae')).toBe('high');
      expect(getFloodRiskLevel('ae floodway')).toBe('high');
    });

    it('returns high for input with leading/trailing spaces', () => {
      expect(getFloodRiskLevel(' AE ')).toBe('high');
    });
  });

  describe('moderate risk zones', () => {
    it('returns moderate for zone B', () => {
      expect(getFloodRiskLevel('B')).toBe('moderate');
    });

    it('returns moderate for "X SHADED"', () => {
      expect(getFloodRiskLevel('X SHADED')).toBe('moderate');
    });

    it('returns moderate for zones containing "SHADED"', () => {
      expect(getFloodRiskLevel('X 0.2 PCT ANNUAL CHANCE FLOOD HAZARD SHADED')).toBe('moderate');
    });
  });

  describe('low risk zones', () => {
    it('returns low for zone C', () => {
      expect(getFloodRiskLevel('C')).toBe('low');
    });

    it('returns low for zone X (unmodified)', () => {
      expect(getFloodRiskLevel('X')).toBe('low');
    });

    it('returns low for "X UNSHADED"', () => {
      expect(getFloodRiskLevel('X UNSHADED')).toBe('low');
    });
  });

  describe('undetermined', () => {
    it('returns undetermined for zone D', () => {
      expect(getFloodRiskLevel('D')).toBe('undetermined');
    });

    it('returns undetermined for empty string', () => {
      expect(getFloodRiskLevel('')).toBe('undetermined');
    });

    it('returns undetermined for unknown zone codes', () => {
      expect(getFloodRiskLevel('Z')).toBe('undetermined');
      expect(getFloodRiskLevel('UNKNOWN')).toBe('undetermined');
    });
  });
});
