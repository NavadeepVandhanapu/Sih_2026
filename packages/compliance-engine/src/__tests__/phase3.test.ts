import { describe, it, expect } from 'vitest';
import { ComplianceEvaluator } from '../evaluator/engine';
import { RuleRegistry } from '../rules/registry';
import { ApplicabilityEngine } from '../applicability/engine';
import { DeclarationExtractor } from '../extractor/declarations';
import { OCRRegion } from '../types';

describe('Phase 3 Compliance Intelligence & Evidence Engine Tests', () => {
  it('should normalize MRP, Net Quantity, Mfg Date, and Consumer Care', () => {
    const rawText = `
      M.R.P: ₹ 150.00 (Incl. of all taxes)
      Net Wt: 500 g
      Mfd: 09/2026
      Consumer Care Email: support@brand.com Tel: 1800-123-4567
      Made in India
    `;

    const decs = DeclarationExtractor.extract(rawText);

    // MRP Normalization
    expect(decs.mrp.normalized).toBeDefined();
    const mrpNorm = decs.mrp.normalized as any;
    expect(mrpNorm.numericValue).toBe(150);
    expect(mrpNorm.currency).toBe('INR');
    expect(mrpNorm.taxInclusive).toBe(true);

    // Net Quantity Normalization
    expect(decs.net_quantity.normalized).toBeDefined();
    const netNorm = decs.net_quantity.normalized as any;
    expect(netNorm.numericValue).toBe(500);
    expect(netNorm.unit).toBe('g');
    expect(netNorm.normalizedKgOrL).toBe(0.5);

    // Mfg Date Normalization
    expect(decs.mfg_date.normalized).toBeDefined();
    const mfgNorm = decs.mfg_date.normalized as any;
    expect(mfgNorm.month).toBe(9);
    expect(mfgNorm.year).toBe(2026);

    // Consumer Care Normalization
    expect(decs.consumer_care.normalized).toBeDefined();
    const careNorm = decs.consumer_care.normalized as any;
    expect(careNorm.email).toBe('support@brand.com');
    expect(careNorm.phone).toBe('1800-123-4567');
    expect(careNorm.hasMultiChannel).toBe(true);
  });

  it('should handle OCR noise and variations in MRP and symbols', () => {
    const noisyText1 = 'MRP Rs.40.00 incl taxes';
    const noisyText2 = 'Maximum Retail Price ₹ 99.50 (inclusive of all taxes)';

    const dec1 = DeclarationExtractor.extract(noisyText1);
    expect(dec1.mrp.detectedValue).toContain('40');

    const dec2 = DeclarationExtractor.extract(noisyText2);
    expect(dec2.mrp.detectedValue).toContain('99.5');
  });

  it('should support RuleRegistry versioning and effective date querying', () => {
    const activeRules = RuleRegistry.getActiveRules('2026-09-15', '2026.1');
    expect(activeRules.length).toBeGreaterThanOrEqual(8);

    const mfgRule = RuleRegistry.getRule('LM-RULE-001', '2026.1');
    expect(mfgRule).toBeDefined();
    expect(mfgRule?.version).toBe('2026.1');
    expect(mfgRule?.sourceMetadata.authority).toContain('Consumer Affairs');
  });

  it('should evaluate rule applicability context and produce NOT_APPLICABLE status', () => {
    const originRule = RuleRegistry.getRule('LM-RULE-008')!;
    const check1 = ApplicabilityEngine.evaluate(originRule, { isImported: false });
    expect(check1.isApplicable).toBe(false);

    const check2 = ApplicabilityEngine.evaluate(originRule, { isImported: true });
    expect(check2.isApplicable).toBe(true);
  });

  it('should trace evidence to multiple OCR regions and build structured findings', () => {
    const ocrText = 'Net Qty: 200 g';
    const regions: OCRRegion[] = [
      { text: 'Net Qty:', confidence: 0.98, boundingBox: { x: 10, y: 20, width: 80, height: 30 } },
      { text: '200 g', confidence: 0.96, boundingBox: { x: 100, y: 20, width: 60, height: 30 } },
    ];

    const analysis = ComplianceEvaluator.analyzeScan(ocrText, undefined, regions);

    expect(analysis.declarations.net_quantity.evidenceRegions).toBeDefined();
    expect(analysis.declarations.net_quantity.evidenceRegions!.length).toBeGreaterThanOrEqual(1);
    expect(analysis.summary.aiConfidence).toBeGreaterThan(0);
    expect(analysis.summary.ruleSetVersion).toBe('2026.1');
  });
});
