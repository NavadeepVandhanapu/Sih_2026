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

    expect(result.country_of_origin.detectedValue).toBe('India');
    expect(result.country_of_origin.confidence).toBeGreaterThan(0.7);
  });

  it('should extract MRP variants accurately', () => {
    const variants = [
      { text: 'MRP ₹70.00', expected: '70.00' },
      { text: 'MRP Rs. 70', expected: '70' },
      { text: 'M.R.P. 70.00', expected: '70.00' },
      { text: 'MAXIMUM RETAIL PRICE Rs 70.00', expected: '70.00' },
      { text: '₹ 70.00', expected: '70.00' },
    ];

    for (const v of variants) {
      const res = DeclarationExtractor.extract(v.text);
      expect(res.mrp.detectedValue).not.toBeNull();
      expect(res.mrp.detectedValue).toContain(v.expected);
    }
  });

  it('should extract Net Quantity variants accurately', () => {
    const variants = [
      { text: '250 g', expected: '250 g' },
      { text: '250g', expected: '250g' },
      { text: 'NET WEIGHT 250 g', expected: '250 g' },
      { text: 'BISCUITS NET WEIGHT 250 g', expected: '250 g' },
      { text: 'NET WT. 250G', expected: '250G' },
      { text: 'NET QTY 250 g', expected: '250 g' },
    ];

    for (const v of variants) {
      const res = DeclarationExtractor.extract(v.text);
      expect(res.net_quantity.detectedValue).not.toBeNull();
      expect(res.net_quantity.detectedValue).toContain('250');
    }
  });

  it('should extract Manufacturing Date variants accurately', () => {
    const variants = [
      'MFD 02/11/23',
      'MFG 02/11/23',
      'MFD: 02/11/23',
      'PKD 02/11/23',
      'DATE OF PACKING 02/11/23',
    ];

    for (const text of variants) {
      const res = DeclarationExtractor.extract(text);
      expect(res.mfg_date.detectedValue).not.toBeNull();
      expect(res.mfg_date.detectedValue).toContain('02/11/23');
    }
  });

  it('should extract Consumer Care variants accurately', () => {
    const variants = [
      { text: 'Consumer Care Cell: 1800-123-4567', expected: '1800-123-4567' },
      { text: 'Customer Care: care@brand.com', expected: 'care@brand.com' },
      { text: 'Toll Free: 1800123456', expected: '1800123456' },
      { text: 'Call: 9876543210 Email: help@brand.in', expected: 'help@brand.in' },
    ];

    for (const v of variants) {
      const res = DeclarationExtractor.extract(v.text);
      expect(res.consumer_care.detectedValue).not.toBeNull();
    }
  });

  it('should extract Manufacturer variants accurately', () => {
    const variants = [
      'Manufactured by Apex Foods Ltd, Sector 18 Gurugram',
      'Marketed by Apex Foods Pvt Ltd',
      'Manufactured & Packed by Apex Industries Ltd',
      'Manufactured at Plot 42 Industrial Area Haridwar',
    ];

    for (const text of variants) {
      const res = DeclarationExtractor.extract(text);
      expect(res.manufacturer.detectedValue).not.toBeNull();
    }
  });
});
