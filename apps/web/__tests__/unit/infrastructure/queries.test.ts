import { classifyFloodRisk, parseBbox } from '@/lib/infrastructure/queries';
import { describe, expect, it } from 'vitest';

describe('parseBbox', () => {
  it('should parse a valid bbox string', () => {
    const result = parseBbox('-98.6,29.3,-98.4,29.6');
    expect(result).toEqual([-98.6, 29.3, -98.4, 29.6]);
  });

  it('should return null for invalid format (too few parts)', () => {
    expect(parseBbox('-98.6,29.3,-98.4')).toBeNull();
  });

  it('should return null for invalid format (too many parts)', () => {
    expect(parseBbox('-98.6,29.3,-98.4,29.6,100')).toBeNull();
  });

  it('should return null for non-numeric values', () => {
    expect(parseBbox('abc,29.3,-98.4,29.6')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(parseBbox('')).toBeNull();
  });

  it('should return null when minLng >= maxLng', () => {
    expect(parseBbox('-98.4,29.3,-98.6,29.6')).toBeNull();
  });

  it('should return null when minLat >= maxLat', () => {
    expect(parseBbox('-98.6,29.6,-98.4,29.3')).toBeNull();
  });

  it('should return null for out-of-range longitude (< -180)', () => {
    expect(parseBbox('-181,29.3,-98.4,29.6')).toBeNull();
  });

  it('should return null for out-of-range longitude (> 180)', () => {
    expect(parseBbox('-98.6,29.3,181,29.6')).toBeNull();
  });

  it('should return null for out-of-range latitude (< -90)', () => {
    expect(parseBbox('-98.6,-91,-98.4,29.6')).toBeNull();
  });

  it('should return null for out-of-range latitude (> 90)', () => {
    expect(parseBbox('-98.6,29.3,-98.4,91')).toBeNull();
  });

  it('should handle boundary-valid coordinates', () => {
    const result = parseBbox('-180,-90,180,90');
    expect(result).toEqual([-180, -90, 180, 90]);
  });
});

describe('classifyFloodRisk', () => {
  it('should classify zone A as high risk', () => {
    expect(classifyFloodRisk('A')).toBe('high');
  });

  it('should classify zone AE as high risk', () => {
    expect(classifyFloodRisk('AE')).toBe('high');
  });

  it('should classify zone AH as high risk', () => {
    expect(classifyFloodRisk('AH')).toBe('high');
  });

  it('should classify zone AO as high risk', () => {
    expect(classifyFloodRisk('AO')).toBe('high');
  });

  it('should classify zone AR as high risk', () => {
    expect(classifyFloodRisk('AR')).toBe('high');
  });

  it('should classify zone A99 as high risk', () => {
    expect(classifyFloodRisk('A99')).toBe('high');
  });

  it('should classify zone V as high risk', () => {
    expect(classifyFloodRisk('V')).toBe('high');
  });

  it('should classify zone VE as high risk', () => {
    expect(classifyFloodRisk('VE')).toBe('high');
  });

  it('should classify zone X as low risk', () => {
    expect(classifyFloodRisk('X')).toBe('low');
  });

  it('should classify zone D as undetermined', () => {
    expect(classifyFloodRisk('D')).toBe('undetermined');
  });

  it('should classify unknown zones as moderate', () => {
    expect(classifyFloodRisk('B')).toBe('moderate');
    expect(classifyFloodRisk('C')).toBe('moderate');
    expect(classifyFloodRisk('UNKNOWN')).toBe('moderate');
  });
});
