import { describe, it, expect } from 'vitest';
import { ComplianceEvaluator } from '../evaluator/engine';
import { LEGAL_METROLOGY_RULES } from '../rules/definitions';

describe('ComplianceEvaluator Engine', () => {
  it('should define statutory Legal Metrology rules', () => {
    expect(LEGAL_METROLOGY_RULES.length).toBeGreaterThanOrEqual(8);
    expect(LEGAL_METROLOGY_RULES.map((r) => r.ruleId)).toContain('LM-RULE-001');
    expect(LEGAL_METROLOGY_RULES.map((r) => r.ruleId)).toContain('LM-RULE-007');
  });

  it('should evaluate a fully compliant packaging scan with high score', () => {
    const ocrText = `
Apex Delight Cream Biscuits
Manufactured by: Apex Foods Pvt. Ltd., Haridwar, Uttarakhand - 249403
Net Quantity: 200 g
MRP: Rs. 40.00 (inclusive of all taxes)
Date of Packing: 08/2026
Unit Sale Price: Rs. 0.20 per g
Consumer Care: Email: care@apexfoods.in, Phone: 1800-200-8899
Made in India
`.trim();

    const analysis = ComplianceEvaluator.analyzeScan(ocrText, {
      packageHeightMm: 160,
      imageHeightPx: 800,
      measuredCharHeightPx: 25,
    });

    expect(analysis.summary.overallStatus).toBe('COMPLIANT');
    expect(analysis.summary.score).toBeGreaterThanOrEqual(85);
    expect(analysis.ruleResults.length).toBeGreaterThan(0);
  });

  it('should flag non-compliance when mandatory net quantity is missing', () => {
    const ocrText = `
Apex Delight Cream Biscuits
Manufactured by: Apex Foods Pvt. Ltd., Haridwar
MRP: Rs. 40.00
`.trim();

    const analysis = ComplianceEvaluator.analyzeScan(ocrText);

    expect(analysis.summary.overallStatus).toBe('POTENTIAL_NON_COMPLIANCE');
    expect(analysis.summary.score).toBeLessThan(80);
    const netQtyResult = analysis.ruleResults.find((r) => r.ruleId === 'LM-RULE-002');
    expect(netQtyResult?.status).toBe('POTENTIAL_NON_COMPLIANCE');
  });
});
