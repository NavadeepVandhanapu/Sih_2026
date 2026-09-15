import { describe, it, expect } from 'vitest';
import { FontAnalyzer } from '../font/analyzer';

describe('FontAnalyzer', () => {
  it('should return statutory minimum height based on net quantity thresholds', () => {
    expect(FontAnalyzer.getRequiredMinimumMm('30 g')).toBe(1.0);
    expect(FontAnalyzer.getRequiredMinimumMm('150 g')).toBe(2.0);
    expect(FontAnalyzer.getRequiredMinimumMm('500 g')).toBe(4.0);
    expect(FontAnalyzer.getRequiredMinimumMm('2 kg')).toBe(6.0);
    expect(FontAnalyzer.getRequiredMinimumMm(null)).toBe(2.0);
  });

  it('should calculate physical character height using physical package height', () => {
    const result = FontAnalyzer.analyze({
      netQtyString: '200 g',
      packageHeightMm: 160,
      imageHeightPx: 800,
      measuredCharHeightPx: 25, // (25 / 800) * 160 = 5.0 mm
    });

    expect(result.estimatedCharHeightMm).toBe(5.0);
    expect(result.requiredMinimumMm).toBe(2.0);
    expect(result.status).toBe('COMPLIANT');
    expect(result.calibrationMethod).toBe('user_dimensions');
  });

  it('should flag potential non-compliance if estimated character height is below statutory minimum', () => {
    const result = FontAnalyzer.analyze({
      netQtyString: '2 kg', // Statutory min is 6.0 mm
      packageHeightMm: 100,
      imageHeightPx: 1000,
      measuredCharHeightPx: 10, // (10 / 1000) * 100 = 1.0 mm
    });

    expect(result.estimatedCharHeightMm).toBe(1.0);
    expect(result.requiredMinimumMm).toBe(6.0);
    expect(result.status).toBe('POTENTIAL_NON_COMPLIANCE');
  });
});
