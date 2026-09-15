import { describe, it, expect } from 'vitest';
import { DeclarationExtractor } from '../extractor/declarations';

describe('DeclarationExtractor', () => {
  it('should extract manufacturer name and address', () => {
    const text = 'Manufactured by: Apex Foods Pvt. Ltd., Plot 42, Sector 5, Haridwar, Uttarakhand - 249403';
    const result = DeclarationExtractor.extract(text);

    expect(result.manufacturer.detectedValue).toContain('Apex Foods Pvt. Ltd.');
    expect(result.manufacturer.confidence).toBeGreaterThan(0.8);
  });

  it('should handle missing manufacturer declaration gracefully', () => {
    const text = 'Random packaging label without legal identity';
    const result = DeclarationExtractor.extract(text);

    expect(result.manufacturer.detectedValue).toBeNull();
    expect(result.manufacturer.confidence).toBeLessThan(0.5);
  });

  it('should extract standard net quantity in grams and milliliters', () => {
    const text1 = 'Net Quantity: 200 g';
    const res1 = DeclarationExtractor.extract(text1);
    expect(res1.net_quantity.detectedValue).toBe('200 g');
    expect(res1.net_quantity.confidence).toBeGreaterThan(0.9);

    const text2 = 'Net Vol: 500 ml';
    const res2 = DeclarationExtractor.extract(text2);
    expect(res2.net_quantity.detectedValue).toBe('500 ml');
  });

  it('should extract Maximum Retail Price (MRP) and tax clause', () => {
    const text = 'MRP: Rs. 120.00 (inclusive of all taxes)';
    const result = DeclarationExtractor.extract(text);

    expect(result.mrp.detectedValue).toContain('120.00');
    expect(result.mrp.detectedValue).toContain('incl');
    expect(result.mrp.confidence).toBeGreaterThan(0.9);
  });

  it('should extract Month and Year of Manufacture/Packing', () => {
    const text = 'Date of Packing: 08/2026';
    const result = DeclarationExtractor.extract(text);

    expect(result.mfg_date.detectedValue).toBe('08/2026');
    expect(result.mfg_date.confidence).toBeGreaterThan(0.9);
  });

  it('should extract Consumer Care email and phone', () => {
    const text = 'Consumer Care Cell: Phone: 1800-200-8899, Email: care@apexfoods.in';
    const result = DeclarationExtractor.extract(text);

    expect(result.consumer_care.detectedValue).toContain('care@apexfoods.in');
    expect(result.consumer_care.detectedValue).toContain('1800-200-8899');
    expect(result.consumer_care.confidence).toBeGreaterThan(0.9);
  });

  it('should extract Unit Sale Price (USP)', () => {
    const text = 'Unit Sale Price: Rs. 0.20 per g';
    const result = DeclarationExtractor.extract(text);

    expect(result.unit_sale_price.detectedValue).toContain('0.20');
    expect(result.unit_sale_price.confidence).toBeGreaterThan(0.85);
  });

  it('should extract Country of Origin', () => {
    const text = 'Made in India';
    const result = DeclarationExtractor.extract(text);

    expect(result.country_of_origin.detectedValue).toContain('India');
    expect(result.country_of_origin.confidence).toBeGreaterThan(0.7);
  });
});
