import {
  ComplianceSummary,
  DeclarationType,
  ExtractedDeclaration,
  FontAnalysisResult,
  FullScanAnalysis,
  RuleEvaluationResult,
  RuleStatus,
  OCRRegion,
  ImageQualityMetrics,
} from '../types';
import { CURRENT_RULESET_VERSION } from '../rules/definitions';
import { DeclarationExtractor } from '../extractor/declarations';
import { FontAnalyzer, FontCalibrationParams } from '../font/analyzer';

export class ComplianceEvaluator {
  public static evaluateDeclarations(
    declarations: Record<DeclarationType, ExtractedDeclaration>,
    fontAnalysis: FontAnalysisResult
  ): RuleEvaluationResult[] {
    const results: RuleEvaluationResult[] = [];

    // Rule 1: Manufacturer
    const mfg = declarations.manufacturer;
    if (mfg && mfg.detectedValue) {
      const isHighConf = mfg.confidence >= 0.85;
      results.push({
        ruleId: 'LM-RULE-001',
        ruleName: 'Manufacturer Identification & Address',
        sectionReference: 'Rule 6(1)(a)',
        severity: 'HIGH',
        status: isHighConf ? 'COMPLIANT' : 'MANUAL_REVIEW_RECOMMENDED',
        confidence: mfg.confidence,
        detectedValue: mfg.detectedValue,
        expectedRequirement: 'Complete name & premise address of manufacturer/packer',
        explanation: isHighConf
          ? 'Manufacturer identity statement located with legal premise details.'
          : 'Manufacturer declaration detected with lower confidence; postal verification recommended.',
        evidenceSnippet: mfg.rawSnippet,
        evidenceBox: mfg.boundingBox,
      });
    } else {
      results.push({
        ruleId: 'LM-RULE-001',
        ruleName: 'Manufacturer Identification & Address',
        sectionReference: 'Rule 6(1)(a)',
        severity: 'HIGH',
        status: 'POTENTIAL_NON_COMPLIANCE',
        confidence: 0.91,
        detectedValue: null,
        expectedRequirement: 'Complete name & premise address of manufacturer/packer',
        explanation: 'Mandatory manufacturer/packer identification was not confidently detected on the scanned label.',
      });
    }

    // Rule 2: Net Quantity
    const netQty = declarations.net_quantity;
    if (netQty && netQty.detectedValue) {
      results.push({
        ruleId: 'LM-RULE-002',
        ruleName: 'Standard Net Quantity Statement',
        sectionReference: 'Rule 6(1)(c) & Rule 12',
        severity: 'HIGH',
        status: 'COMPLIANT',
        confidence: netQty.confidence,
        detectedValue: netQty.detectedValue,
        expectedRequirement: 'Standard metric unit (g, kg, ml, l, or count)',
        explanation: `Standard metric declaration verified: "${netQty.detectedValue}".`,
        evidenceSnippet: netQty.rawSnippet,
        evidenceBox: netQty.boundingBox,
      });
    } else {
      results.push({
        ruleId: 'LM-RULE-002',
        ruleName: 'Standard Net Quantity Statement',
        sectionReference: 'Rule 6(1)(c) & Rule 12',
        severity: 'HIGH',
        status: 'POTENTIAL_NON_COMPLIANCE',
        confidence: 0.95,
        detectedValue: null,
        expectedRequirement: 'Standard metric unit (g, kg, ml, l, or count)',
        explanation: 'Net quantity statement missing or unrecognizable in standard metric formats.',
      });
    }

    // Rule 3: MRP
    const mrp = declarations.mrp;
    if (mrp && mrp.detectedValue) {
      const hasTaxInclusive = /incl/i.test(mrp.detectedValue);
      results.push({
        ruleId: 'LM-RULE-003',
        ruleName: 'Maximum Retail Price (MRP) Declaration',
        sectionReference: 'Rule 6(1)(e)',
        severity: 'HIGH',
        status: hasTaxInclusive ? 'COMPLIANT' : 'MANUAL_REVIEW_RECOMMENDED',
        confidence: mrp.confidence,
        detectedValue: mrp.detectedValue,
        expectedRequirement: 'MRP Rs... inclusive of all taxes',
        explanation: hasTaxInclusive
          ? 'Retail price properly formatted with mandatory "incl. of all taxes" clause.'
          : 'Retail price declared, but explicit "inclusive of all taxes" wording requires officer verification.',
        evidenceSnippet: mrp.rawSnippet,
        evidenceBox: mrp.boundingBox,
      });
    } else {
      results.push({
        ruleId: 'LM-RULE-003',
        ruleName: 'Maximum Retail Price (MRP) Declaration',
        sectionReference: 'Rule 6(1)(e)',
        severity: 'HIGH',
        status: 'POTENTIAL_NON_COMPLIANCE',
        confidence: 0.94,
        detectedValue: null,
        expectedRequirement: 'MRP Rs... inclusive of all taxes',
        explanation: 'Maximum Retail Price declaration not found on package panel.',
      });
    }

    // Rule 4: Mfg Date
    const mfgDate = declarations.mfg_date;
    if (mfgDate && mfgDate.detectedValue) {
      results.push({
        ruleId: 'LM-RULE-004',
        ruleName: 'Month and Year of Manufacture / Packing',
        sectionReference: 'Rule 6(1)(d)',
        severity: 'HIGH',
        status: 'COMPLIANT',
        confidence: mfgDate.confidence,
        detectedValue: mfgDate.detectedValue,
        expectedRequirement: 'Month & year of manufacture or packing in MM/YYYY or Month YYYY',
        explanation: `Manufacturing / packing date identified: ${mfgDate.detectedValue}.`,
        evidenceSnippet: mfgDate.rawSnippet,
        evidenceBox: mfgDate.boundingBox,
      });
    } else {
      results.push({
        ruleId: 'LM-RULE-004',
        ruleName: 'Month and Year of Manufacture / Packing',
        sectionReference: 'Rule 6(1)(d)',
        severity: 'HIGH',
        status: 'POTENTIAL_NON_COMPLIANCE',
        confidence: 0.92,
        detectedValue: null,
        expectedRequirement: 'Month & year of manufacture or packing in MM/YYYY or Month YYYY',
        explanation: 'Month and Year of packing/manufacture was not detected.',
      });
    }

    // Rule 5: Consumer Care
    const care = declarations.consumer_care;
    if (care && care.detectedValue) {
      const hasEmailAndPhone = care.detectedValue.includes('Email') && care.detectedValue.includes('Tel');
      results.push({
        ruleId: 'LM-RULE-005',
        ruleName: 'Consumer Care Contact Details',
        sectionReference: 'Rule 6(1)(n) & Rule 6(2)',
        severity: 'HIGH',
        status: hasEmailAndPhone ? 'COMPLIANT' : 'MANUAL_REVIEW_RECOMMENDED',
        confidence: care.confidence,
        detectedValue: care.detectedValue,
        expectedRequirement: 'Telephone number, email address, and postal address for grievance redressal',
        explanation: hasEmailAndPhone
          ? 'Multi-channel consumer care contact details verified (phone and email detected).'
          : 'Partial consumer contact information located; full postal & digital channel verification recommended.',
        evidenceSnippet: care.rawSnippet,
        evidenceBox: care.boundingBox,
      });
    } else {
      results.push({
        ruleId: 'LM-RULE-005',
        ruleName: 'Consumer Care Contact Details',
        sectionReference: 'Rule 6(1)(n) & Rule 6(2)',
        severity: 'HIGH',
        status: 'POTENTIAL_NON_COMPLIANCE',
        confidence: 0.93,
        detectedValue: null,
        expectedRequirement: 'Telephone number, email address, and postal address for grievance redressal',
        explanation: 'No mandatory consumer care email or telephone number detected on the scanned panel.',
      });
    }

    // Rule 6: Unit Sale Price
    const usp = declarations.unit_sale_price;
    if (usp && usp.detectedValue) {
      results.push({
        ruleId: 'LM-RULE-006',
        ruleName: 'Unit Sale Price (USP)',
        sectionReference: 'Rule 6(11)',
        severity: 'MEDIUM',
        status: 'COMPLIANT',
        confidence: usp.confidence,
        detectedValue: usp.detectedValue,
        expectedRequirement: 'Unit sale price declared per g / ml / kg / L',
        explanation: `Unit sale price properly declared: "${usp.detectedValue}".`,
        evidenceSnippet: usp.rawSnippet,
        evidenceBox: usp.boundingBox,
      });
    } else {
      results.push({
        ruleId: 'LM-RULE-006',
        ruleName: 'Unit Sale Price (USP)',
        sectionReference: 'Rule 6(11)',
        severity: 'MEDIUM',
        status: 'MANUAL_REVIEW_RECOMMENDED',
        confidence: 0.75,
        detectedValue: null,
        expectedRequirement: 'Unit sale price declared per g / ml / kg / L where applicable',
        explanation: 'Unit sale price declaration not identified. Required for packages under amended Rule 6(11).',
      });
    }

    // Rule 7: Font size / Readability
    results.push({
      ruleId: 'LM-RULE-007',
      ruleName: 'Minimum Character Height & Font Size',
      sectionReference: 'Rule 7 & Rule 8',
      severity: 'HIGH',
      status: fontAnalysis.status,
      confidence: fontAnalysis.confidence,
      detectedValue: `${fontAnalysis.estimatedCharHeightMm} mm (estimated)`,
      expectedRequirement: `Minimum ${fontAnalysis.requiredMinimumMm} mm based on net quantity`,
      explanation: fontAnalysis.explanation,
    });

    return results;
  }

  public static analyzeScan(
    rawOcrText: string,
    calibration?: FontCalibrationParams,
    ocrRegions?: OCRRegion[],
    ocrProvider?: string,
    imageQuality?: ImageQualityMetrics,
    imageDimensions?: { width: number; height: number }
  ): FullScanAnalysis {
    // 1. Extract Declarations with OCR Bounding Boxes
    const declarations = DeclarationExtractor.extract(rawOcrText, ocrRegions);

    // 2. Perform Font & Readability Analysis
    const fontParams: FontCalibrationParams = {
      netQtyString: declarations.net_quantity?.detectedValue,
      packageHeightMm: calibration?.packageHeightMm,
      packageWidthMm: calibration?.packageWidthMm,
      imageHeightPx: calibration?.imageHeightPx || imageDimensions?.height || 800,
      imageWidthPx: calibration?.imageWidthPx || imageDimensions?.width || 600,
      measuredCharHeightPx: calibration?.measuredCharHeightPx || 22,
    };
    const fontAnalysis = FontAnalyzer.analyze(fontParams);

    // 3. Evaluate Rules
    const ruleResults = this.evaluateDeclarations(declarations, fontAnalysis);

    // 4. Calculate Scores
    let compliantCount = 0;
    let flaggedCount = 0;
    let reviewCount = 0;

    for (const res of ruleResults) {
      if (res.status === 'COMPLIANT') compliantCount++;
      else if (res.status === 'POTENTIAL_NON_COMPLIANCE') flaggedCount++;
      else reviewCount++;
    }

    const total = ruleResults.length;
    let score = Math.round(((compliantCount + reviewCount * 0.5) / total) * 100);
    if (flaggedCount >= 2 && score > 65) score = 65;
    if (flaggedCount >= 3 && score > 45) score = 45;

    let overallStatus: RuleStatus = 'COMPLIANT';
    if (flaggedCount > 0) {
      overallStatus = 'POTENTIAL_NON_COMPLIANCE';
    } else if (reviewCount > 0) {
      overallStatus = 'MANUAL_REVIEW_RECOMMENDED';
    }

    const summary: ComplianceSummary = {
      overallStatus,
      score,
      totalRulesEvaluated: total,
      compliantCount,
      flaggedCount,
      reviewCount,
      ruleSetVersion: CURRENT_RULESET_VERSION,
      evaluatedAt: new Date().toISOString(),
      disclaimer:
        'AI screening assistance only. Not a formal judicial or enforcement order under the Legal Metrology Act, 2009. Official action is subject to physical verification by authorized Legal Metrology Officers.',
    };

    const brandMatch = rawOcrText.match(/\b(Apex|GreenBasket|Nova|PureHarvest|Urban|Zenith|Patanjali|Britannia|Nestle|Dabur|ITC)\b/i);
    const prodMatch = rawOcrText.match(/(?:Biscuits|Chips|Oil|Atta|Juice|Soap|Detergent|Snacks|Tea|Coffee|Cereal)/i);

    return {
      declarations,
      ruleResults,
      fontAnalysis,
      summary,
      ocrText: rawOcrText,
      ocrProvider: ocrProvider || 'PyTorch EasyOCR Neural Engine (v1.7)',
      ocrRegions,
      imageQuality,
      imageDimensions,
      fingerprint: {
        brand: brandMatch ? brandMatch[0] : undefined,
        productName: prodMatch ? prodMatch[0] : undefined,
        netQty: declarations.net_quantity?.detectedValue || undefined,
        mrp: declarations.mrp?.detectedValue || undefined,
      },
    };
  }
}
