import {
  ComplianceSummary,
  DeclarationType,
  ExtractedDeclaration,
  Finding,
  FontAnalysisResult,
  FullScanAnalysis,
  ImageQualityMetrics,
  ImageIntegrityMetadata,
  OCRRegion,
  RuleEvaluationResult,
  RuleStatus,
  Jurisdiction,
} from '../types';
import { CURRENT_RULESET_VERSION, RuleRegistry } from '../rules/registry';
import { ApplicabilityContext, ApplicabilityEngine } from '../applicability/engine';
import { DeclarationExtractor } from '../extractor/declarations';
import { FontAnalyzer, FontCalibrationParams } from '../font/analyzer';

export interface EvaluationOptions {
  productCategory?: string;
  isImported?: boolean;
  jurisdiction?: Jurisdiction;
  scanDate?: string;
  ruleSetVersion?: string;
  imageIntegrity?: ImageIntegrityMetadata;
  imageQuality?: ImageQualityMetrics;
  rawOcrText?: string;
  ocrRegions?: OCRRegion[];
}

export class ComplianceEvaluator {
  public static evaluateDeclarations(
    declarations: Record<DeclarationType, ExtractedDeclaration>,
    fontAnalysis: FontAnalysisResult,
    options: EvaluationOptions = {}
  ): { ruleResults: RuleEvaluationResult[]; findings: Finding[] } {
    const ruleVersion = options.ruleSetVersion || CURRENT_RULESET_VERSION;
    const activeRules = RuleRegistry.getActiveRules(options.scanDate, ruleVersion, options.jurisdiction);

    const ruleResults: RuleEvaluationResult[] = [];
    const findings: Finding[] = [];

    const netQuantityVal = (declarations.net_quantity?.normalized as any)?.numericValue || undefined;
    const netQuantityUnit = (declarations.net_quantity?.normalized as any)?.unit || undefined;

    // Assess overall OCR text coverage to distinguish "NOT FOUND BY OCR" from "DEFINITIVELY MISSING"
    const detectedCount = Object.values(declarations).filter((d) => d && d.detectedValue).length;
    const rawTextWords = (options.rawOcrText || '').split(/\s+/).filter(w => w.length > 0).length;
    const isLowCoverage = detectedCount < 2 && (rawTextWords < 10 || (options.imageQuality && options.imageQuality.score < 0.20));

    const context: ApplicabilityContext = {
      productCategory: options.productCategory,
      isImported: options.isImported,
      netQuantityVal,
      netQuantityUnit,
      jurisdiction: options.jurisdiction || 'CENTRAL',
      scanDate: options.scanDate,
    };

    for (const ruleDef of activeRules) {
      const appCheck = ApplicabilityEngine.evaluate(ruleDef, context);

      // 1. Not Applicable handling
      if (!appCheck.isApplicable) {
        ruleResults.push({
          ruleId: ruleDef.ruleId,
          ruleName: ruleDef.name,
          ruleVersion: ruleDef.version,
          sectionReference: ruleDef.sectionReference,
          severity: ruleDef.severity,
          status: 'NOT_APPLICABLE',
          confidence: 1.0,
          detectedValue: null,
          expectedRequirement: ruleDef.expectedRequirement,
          explanation: appCheck.reason || 'Rule not applicable to current product packaging parameters.',
          officialSource: `${ruleDef.sourceMetadata.documentName}, ${ruleDef.sourceMetadata.ruleNumber}`,
        });
        continue;
      }

      // 2. Evaluate Rule 1: Manufacturer
      if (ruleDef.ruleId === 'LM-RULE-001') {
        const mfg = declarations.manufacturer;
        if (mfg && mfg.detectedValue) {
          const isHighConf = mfg.confidence >= 0.85;
          const status: RuleStatus = isHighConf ? 'COMPLIANT' : 'MANUAL_REVIEW_RECOMMENDED';
          const result: RuleEvaluationResult = {
            ruleId: ruleDef.ruleId,
            ruleName: ruleDef.name,
            ruleVersion: ruleDef.version,
            sectionReference: ruleDef.sectionReference,
            severity: ruleDef.severity,
            status,
            confidence: mfg.confidence,
            detectedValue: mfg.detectedValue,
            expectedRequirement: ruleDef.expectedRequirement,
            explanation: isHighConf
              ? 'Manufacturer identity statement located with legal premise details.'
              : 'Manufacturer declaration detected with lower confidence; postal verification recommended.',
            evidenceSnippet: mfg.rawSnippet,
            evidenceBox: mfg.boundingBox,
            evidenceRegions: mfg.evidenceRegions || (mfg.boundingBox ? [mfg.boundingBox] : []),
            officialSource: `${ruleDef.sourceMetadata.documentName}, ${ruleDef.sourceMetadata.ruleNumber}`,
          };
          ruleResults.push(result);
          if (status !== 'COMPLIANT') {
            findings.push(this.createFinding(result, 'manufacturer'));
          }
        } else {
          const status: RuleStatus = isLowCoverage ? 'MANUAL_REVIEW_RECOMMENDED' : 'POTENTIAL_NON_COMPLIANCE';
          const result: RuleEvaluationResult = {
            ruleId: ruleDef.ruleId,
            ruleName: ruleDef.name,
            ruleVersion: ruleDef.version,
            sectionReference: ruleDef.sectionReference,
            severity: ruleDef.severity,
            status,
            confidence: isLowCoverage ? 0.60 : 0.91,
            detectedValue: null,
            expectedRequirement: ruleDef.expectedRequirement,
            explanation: isLowCoverage
              ? 'Manufacturer declaration not located due to low OCR coverage. Manual verification recommended.'
              : 'Mandatory manufacturer/packer identification was not detected on the scanned label.',
            officialSource: `${ruleDef.sourceMetadata.documentName}, ${ruleDef.sourceMetadata.ruleNumber}`,
          };
          ruleResults.push(result);
          findings.push(this.createFinding(result, 'manufacturer'));
        }
      }

      // 3. Evaluate Rule 2: Net Quantity
      else if (ruleDef.ruleId === 'LM-RULE-002') {
        const netQty = declarations.net_quantity;
        if (netQty && netQty.detectedValue) {
          const result: RuleEvaluationResult = {
            ruleId: ruleDef.ruleId,
            ruleName: ruleDef.name,
            ruleVersion: ruleDef.version,
            sectionReference: ruleDef.sectionReference,
            severity: ruleDef.severity,
            status: 'COMPLIANT',
            confidence: netQty.confidence,
            detectedValue: netQty.detectedValue,
            expectedRequirement: ruleDef.expectedRequirement,
            explanation: `Standard metric declaration verified: "${netQty.detectedValue}".`,
            evidenceSnippet: netQty.rawSnippet,
            evidenceBox: netQty.boundingBox,
            evidenceRegions: netQty.evidenceRegions || (netQty.boundingBox ? [netQty.boundingBox] : []),
            officialSource: `${ruleDef.sourceMetadata.documentName}, ${ruleDef.sourceMetadata.ruleNumber}`,
          };
          ruleResults.push(result);
        } else {
          const status: RuleStatus = isLowCoverage ? 'MANUAL_REVIEW_RECOMMENDED' : 'POTENTIAL_NON_COMPLIANCE';
          const result: RuleEvaluationResult = {
            ruleId: ruleDef.ruleId,
            ruleName: ruleDef.name,
            ruleVersion: ruleDef.version,
            sectionReference: ruleDef.sectionReference,
            severity: ruleDef.severity,
            status,
            confidence: isLowCoverage ? 0.60 : 0.95,
            detectedValue: null,
            expectedRequirement: ruleDef.expectedRequirement,
            explanation: isLowCoverage
              ? 'Net quantity declaration not located due to low OCR coverage. Manual verification recommended.'
              : 'Net quantity statement missing or unrecognizable in standard metric formats.',
            officialSource: `${ruleDef.sourceMetadata.documentName}, ${ruleDef.sourceMetadata.ruleNumber}`,
          };
          ruleResults.push(result);
          findings.push(this.createFinding(result, 'net_quantity'));
        }
      }

      // 4. Evaluate Rule 3: MRP
      else if (ruleDef.ruleId === 'LM-RULE-003') {
        const mrp = declarations.mrp;
        if (mrp && mrp.detectedValue) {
          const hasTaxInclusive = (mrp.normalized as any)?.taxInclusive ?? /incl/i.test(mrp.detectedValue);
          const status: RuleStatus = hasTaxInclusive ? 'COMPLIANT' : 'MANUAL_REVIEW_RECOMMENDED';
          const result: RuleEvaluationResult = {
            ruleId: ruleDef.ruleId,
            ruleName: ruleDef.name,
            ruleVersion: ruleDef.version,
            sectionReference: ruleDef.sectionReference,
            severity: ruleDef.severity,
            status,
            confidence: mrp.confidence,
            detectedValue: mrp.detectedValue,
            expectedRequirement: ruleDef.expectedRequirement,
            explanation: hasTaxInclusive
              ? 'Retail price properly formatted with mandatory "incl. of all taxes" clause.'
              : 'Retail price declared, but explicit "inclusive of all taxes" wording requires officer verification.',
            evidenceSnippet: mrp.rawSnippet,
            evidenceBox: mrp.boundingBox,
            evidenceRegions: mrp.evidenceRegions || (mrp.boundingBox ? [mrp.boundingBox] : []),
            officialSource: `${ruleDef.sourceMetadata.documentName}, ${ruleDef.sourceMetadata.ruleNumber}`,
          };
          ruleResults.push(result);
          if (status !== 'COMPLIANT') {
            findings.push(this.createFinding(result, 'mrp'));
          }
        } else {
          const status: RuleStatus = isLowCoverage ? 'MANUAL_REVIEW_RECOMMENDED' : 'POTENTIAL_NON_COMPLIANCE';
          const result: RuleEvaluationResult = {
            ruleId: ruleDef.ruleId,
            ruleName: ruleDef.name,
            ruleVersion: ruleDef.version,
            sectionReference: ruleDef.sectionReference,
            severity: ruleDef.severity,
            status,
            confidence: isLowCoverage ? 0.60 : 0.94,
            detectedValue: null,
            expectedRequirement: ruleDef.expectedRequirement,
            explanation: isLowCoverage
              ? 'MRP declaration not located due to low OCR coverage. Manual verification recommended.'
              : 'Maximum Retail Price declaration not found on package panel.',
            officialSource: `${ruleDef.sourceMetadata.documentName}, ${ruleDef.sourceMetadata.ruleNumber}`,
          };
          ruleResults.push(result);
          findings.push(this.createFinding(result, 'mrp'));
        }
      }

      // 5. Evaluate Rule 4: Mfg Date
      else if (ruleDef.ruleId === 'LM-RULE-004') {
        const mfgDate = declarations.mfg_date;
        if (mfgDate && mfgDate.detectedValue) {
          const result: RuleEvaluationResult = {
            ruleId: ruleDef.ruleId,
            ruleName: ruleDef.name,
            ruleVersion: ruleDef.version,
            sectionReference: ruleDef.sectionReference,
            severity: ruleDef.severity,
            status: 'COMPLIANT',
            confidence: mfgDate.confidence,
            detectedValue: mfgDate.detectedValue,
            expectedRequirement: ruleDef.expectedRequirement,
            explanation: `Manufacturing / packing date identified: ${mfgDate.detectedValue}.`,
            evidenceSnippet: mfgDate.rawSnippet,
            evidenceBox: mfgDate.boundingBox,
            evidenceRegions: mfgDate.evidenceRegions || (mfgDate.boundingBox ? [mfgDate.boundingBox] : []),
            officialSource: `${ruleDef.sourceMetadata.documentName}, ${ruleDef.sourceMetadata.ruleNumber}`,
          };
          ruleResults.push(result);
        } else {
          const status: RuleStatus = isLowCoverage ? 'MANUAL_REVIEW_RECOMMENDED' : 'POTENTIAL_NON_COMPLIANCE';
          const result: RuleEvaluationResult = {
            ruleId: ruleDef.ruleId,
            ruleName: ruleDef.name,
            ruleVersion: ruleDef.version,
            sectionReference: ruleDef.sectionReference,
            severity: ruleDef.severity,
            status,
            confidence: isLowCoverage ? 0.60 : 0.92,
            detectedValue: null,
            expectedRequirement: ruleDef.expectedRequirement,
            explanation: isLowCoverage
              ? 'Manufacturing / packing date not located due to low OCR coverage. Manual verification recommended.'
              : 'Month and Year of packing/manufacture was not detected.',
            officialSource: `${ruleDef.sourceMetadata.documentName}, ${ruleDef.sourceMetadata.ruleNumber}`,
          };
          ruleResults.push(result);
          findings.push(this.createFinding(result, 'mfg_date'));
        }
      }

      // 6. Evaluate Rule 5: Consumer Care
      else if (ruleDef.ruleId === 'LM-RULE-005') {
        const care = declarations.consumer_care;
        if (care && care.detectedValue) {
          const hasMultiChannel = (care.normalized as any)?.hasMultiChannel ?? (care.detectedValue.includes('Email') && care.detectedValue.includes('Tel'));
          const status: RuleStatus = hasMultiChannel ? 'COMPLIANT' : 'MANUAL_REVIEW_RECOMMENDED';
          const result: RuleEvaluationResult = {
            ruleId: ruleDef.ruleId,
            ruleName: ruleDef.name,
            ruleVersion: ruleDef.version,
            sectionReference: ruleDef.sectionReference,
            severity: ruleDef.severity,
            status,
            confidence: care.confidence,
            detectedValue: care.detectedValue,
            expectedRequirement: ruleDef.expectedRequirement,
            explanation: hasMultiChannel
              ? 'Multi-channel consumer care contact details verified (phone and email detected).'
              : 'Partial consumer contact information located; full postal & digital channel verification recommended.',
            evidenceSnippet: care.rawSnippet,
            evidenceBox: care.boundingBox,
            evidenceRegions: care.evidenceRegions || (care.boundingBox ? [care.boundingBox] : []),
            officialSource: `${ruleDef.sourceMetadata.documentName}, ${ruleDef.sourceMetadata.ruleNumber}`,
          };
          ruleResults.push(result);
          if (status !== 'COMPLIANT') {
            findings.push(this.createFinding(result, 'consumer_care'));
          }
        } else {
          const status: RuleStatus = isLowCoverage ? 'MANUAL_REVIEW_RECOMMENDED' : 'POTENTIAL_NON_COMPLIANCE';
          const result: RuleEvaluationResult = {
            ruleId: ruleDef.ruleId,
            ruleName: ruleDef.name,
            ruleVersion: ruleDef.version,
            sectionReference: ruleDef.sectionReference,
            severity: ruleDef.severity,
            status,
            confidence: isLowCoverage ? 0.60 : 0.93,
            detectedValue: null,
            expectedRequirement: ruleDef.expectedRequirement,
            explanation: isLowCoverage
              ? 'Consumer care contact details not located due to low OCR coverage. Manual verification recommended.'
              : 'No mandatory consumer care email or telephone number detected on the scanned panel.',
            officialSource: `${ruleDef.sourceMetadata.documentName}, ${ruleDef.sourceMetadata.ruleNumber}`,
          };
          ruleResults.push(result);
          findings.push(this.createFinding(result, 'consumer_care'));
        }
      }

      // 7. Evaluate Rule 6: Unit Sale Price
      else if (ruleDef.ruleId === 'LM-RULE-006') {
        const usp = declarations.unit_sale_price;
        if (usp && usp.detectedValue) {
          const result: RuleEvaluationResult = {
            ruleId: ruleDef.ruleId,
            ruleName: ruleDef.name,
            ruleVersion: ruleDef.version,
            sectionReference: ruleDef.sectionReference,
            severity: ruleDef.severity,
            status: 'COMPLIANT',
            confidence: usp.confidence,
            detectedValue: usp.detectedValue,
            expectedRequirement: ruleDef.expectedRequirement,
            explanation: `Unit sale price properly declared: "${usp.detectedValue}".`,
            evidenceSnippet: usp.rawSnippet,
            evidenceBox: usp.boundingBox,
            evidenceRegions: usp.evidenceRegions || (usp.boundingBox ? [usp.boundingBox] : []),
            officialSource: `${ruleDef.sourceMetadata.documentName}, ${ruleDef.sourceMetadata.ruleNumber}`,
          };
          ruleResults.push(result);
        } else {
          const result: RuleEvaluationResult = {
            ruleId: ruleDef.ruleId,
            ruleName: ruleDef.name,
            ruleVersion: ruleDef.version,
            sectionReference: ruleDef.sectionReference,
            severity: ruleDef.severity,
            status: 'MANUAL_REVIEW_RECOMMENDED',
            confidence: 0.75,
            detectedValue: null,
            expectedRequirement: ruleDef.expectedRequirement,
            explanation: 'Unit sale price declaration not identified. Required for packages under amended Rule 6(11).',
            officialSource: `${ruleDef.sourceMetadata.documentName}, ${ruleDef.sourceMetadata.ruleNumber}`,
          };
          ruleResults.push(result);
          findings.push(this.createFinding(result, 'unit_sale_price'));
        }
      }

      // 8. Evaluate Rule 7: Minimum Font Size
      else if (ruleDef.ruleId === 'LM-RULE-007') {
        const result: RuleEvaluationResult = {
          ruleId: ruleDef.ruleId,
          ruleName: ruleDef.name,
          ruleVersion: ruleDef.version,
          sectionReference: ruleDef.sectionReference,
          severity: ruleDef.severity,
          status: fontAnalysis.status,
          confidence: fontAnalysis.confidence,
          detectedValue: `${fontAnalysis.estimatedCharHeightMm} mm (estimated)`,
          expectedRequirement: `Minimum ${fontAnalysis.requiredMinimumMm} mm based on net quantity`,
          explanation: fontAnalysis.explanation,
          officialSource: `${ruleDef.sourceMetadata.documentName}, ${ruleDef.sourceMetadata.ruleNumber}`,
        };
        ruleResults.push(result);
        if (fontAnalysis.status !== 'COMPLIANT' && fontAnalysis.status !== 'NOT_APPLICABLE') {
          findings.push(this.createFinding(result));
        }
      }

      // 9. Evaluate Rule 8: Country of Origin
      else if (ruleDef.ruleId === 'LM-RULE-008') {
        const origin = declarations.country_of_origin;
        if (origin && origin.detectedValue) {
          const result: RuleEvaluationResult = {
            ruleId: ruleDef.ruleId,
            ruleName: ruleDef.name,
            ruleVersion: ruleDef.version,
            sectionReference: ruleDef.sectionReference,
            severity: ruleDef.severity,
            status: 'COMPLIANT',
            confidence: origin.confidence,
            detectedValue: origin.detectedValue,
            expectedRequirement: ruleDef.expectedRequirement,
            explanation: `Country of Origin statement verified: "${origin.detectedValue}".`,
            evidenceSnippet: origin.rawSnippet,
            evidenceBox: origin.boundingBox,
            evidenceRegions: origin.evidenceRegions || (origin.boundingBox ? [origin.boundingBox] : []),
            officialSource: `${ruleDef.sourceMetadata.documentName}, ${ruleDef.sourceMetadata.ruleNumber}`,
          };
          ruleResults.push(result);
        } else {
          const result: RuleEvaluationResult = {
            ruleId: ruleDef.ruleId,
            ruleName: ruleDef.name,
            ruleVersion: ruleDef.version,
            sectionReference: ruleDef.sectionReference,
            severity: ruleDef.severity,
            status: 'MANUAL_REVIEW_RECOMMENDED',
            confidence: 0.65,
            detectedValue: null,
            expectedRequirement: ruleDef.expectedRequirement,
            explanation: 'Country of Origin not stated. Required for imported commodities under Rule 6(1)(aa).',
            officialSource: `${ruleDef.sourceMetadata.documentName}, ${ruleDef.sourceMetadata.ruleNumber}`,
          };
          ruleResults.push(result);
          findings.push(this.createFinding(result, 'country_of_origin'));
        }
      }
    }

    return { ruleResults, findings };
  }

  private static createFinding(result: RuleEvaluationResult, decType?: DeclarationType): Finding {
    return {
      id: `fnd-${result.ruleId.toLowerCase()}-${Date.now().toString(36)}`,
      ruleId: result.ruleId,
      ruleVersion: result.ruleVersion,
      declarationType: decType,
      severity: result.severity,
      status: result.status,
      title: result.ruleName,
      explanation: result.explanation,
      confidence: result.confidence,
      evidenceSnippet: result.evidenceSnippet,
      evidenceRegions: result.evidenceRegions || (result.evidenceBox ? [result.evidenceBox] : []),
      officialSource: result.officialSource || 'Legal Metrology (Packaged Commodities) Rules, 2011',
    };
  }

  public static analyzeScan(
    rawOcrText: string,
    calibration?: FontCalibrationParams,
    ocrRegions?: OCRRegion[],
    ocrProvider?: string,
    imageQuality?: ImageQualityMetrics,
    imageDimensions?: { width: number; height: number },
    options: EvaluationOptions = {}
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

    // 3. Evaluate Rules against Applicability Context with full OCR quality options
    const evalOptions: EvaluationOptions = {
      ...options,
      imageQuality,
      rawOcrText,
      ocrRegions,
    };
    const { ruleResults, findings } = this.evaluateDeclarations(declarations, fontAnalysis, evalOptions);

    // 4. Calculate Compliance Screening Score & AI Confidence
    let compliantCount = 0;
    let flaggedCount = 0;
    let reviewCount = 0;
    let notApplicableCount = 0;

    let totalAiConfSum = 0;
    let aiConfCount = 0;

    for (const res of ruleResults) {
      if (res.status === 'COMPLIANT') compliantCount++;
      else if (res.status === 'POTENTIAL_NON_COMPLIANCE') flaggedCount++;
      else if (res.status === 'MANUAL_REVIEW_RECOMMENDED') reviewCount++;
      else if (res.status === 'NOT_APPLICABLE') notApplicableCount++;

      if (res.status !== 'NOT_APPLICABLE') {
        totalAiConfSum += res.confidence;
        aiConfCount++;
      }
    }

    const applicableTotal = ruleResults.length - notApplicableCount;
    const total = applicableTotal > 0 ? applicableTotal : 1;

    let score = Math.round(((compliantCount + reviewCount * 0.5) / total) * 100);
    if (flaggedCount >= 2 && score > 65) score = 65;
    if (flaggedCount >= 3 && score > 45) score = 45;

    const aiConfidence = aiConfCount > 0 ? Math.round((totalAiConfSum / aiConfCount) * 100) : 92;

    let overallStatus: RuleStatus = 'COMPLIANT';
    if (flaggedCount > 0) {
      overallStatus = 'POTENTIAL_NON_COMPLIANCE';
    } else if (reviewCount > 0) {
      overallStatus = 'MANUAL_REVIEW_RECOMMENDED';
    }

    const summary: ComplianceSummary = {
      overallStatus,
      score,
      aiConfidence,
      totalRulesEvaluated: ruleResults.length,
      compliantCount,
      flaggedCount,
      reviewCount,
      notApplicableCount,
      ruleSetVersion: options.ruleSetVersion || CURRENT_RULESET_VERSION,
      evaluatedAt: new Date().toISOString(),
      disclaimer:
        'AI screening assistance only. Not a formal judicial or enforcement order under the Legal Metrology Act, 2009. Official action is subject to physical verification by authorized Legal Metrology Officers.',
    };

    const brandMatch = rawOcrText.match(/\b(Apex|GreenBasket|Nova|PureHarvest|Urban|Zenith|Patanjali|Britannia|Nestle|Dabur|ITC)\b/i);
    const prodMatch = rawOcrText.match(/(?:Biscuits|Chips|Oil|Atta|Juice|Soap|Detergent|Snacks|Tea|Coffee|Cereal)/i);

    return {
      declarations,
      ruleResults,
      findings,
      fontAnalysis,
      summary,
      ocrText: rawOcrText,
      ocrProvider: ocrProvider || 'PyTorch EasyOCR Neural Engine (v1.7)',
      ocrRegions,
      imageQuality,
      imageDimensions,
      imageIntegrity: options.imageIntegrity,
      fingerprint: {
        brand: brandMatch ? brandMatch[0] : undefined,
        productName: prodMatch ? prodMatch[0] : undefined,
        netQty: declarations.net_quantity?.detectedValue || undefined,
        mrp: declarations.mrp?.detectedValue || undefined,
      },
    };
  }
}
