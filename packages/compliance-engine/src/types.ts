export type DeclarationType =
  | 'manufacturer'
  | 'packer_importer'
  | 'net_quantity'
  | 'mrp'
  | 'mfg_date'
  | 'consumer_care'
  | 'unit_sale_price'
  | 'country_of_origin';

export type RuleStatus =
  | 'COMPLIANT'
  | 'POTENTIAL_NON_COMPLIANCE'
  | 'MANUAL_REVIEW_RECOMMENDED';

export type RuleSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface BoundingBox {
  x: number;      // pixels or percentages
  y: number;
  width: number;
  height: number;
}

export interface OCRRegion {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  polygon?: number[][];
}

export interface ImageQualityMetrics {
  score: number;
  blur_variance: number;
  brightness: number;
  contrast: number;
  resolution_status: string;
  is_usable: boolean;
}

export interface ExtractedDeclaration {
  type: DeclarationType;
  label: string;
  detectedValue: string | null;
  confidence: number;          // 0.0 - 1.0
  rawSnippet?: string;
  boundingBox?: BoundingBox;
  notes?: string;
}

export interface FontAnalysisResult {
  estimatedCharHeightMm: number;
  requiredMinimumMm: number;
  calibrationMethod: 'user_dimensions' | 'reference_marker' | 'estimated_dpi';
  packageHeightMm?: number;
  packageWidthMm?: number;
  status: RuleStatus;
  confidence: number;
  explanation: string;
}

export interface RuleDefinition {
  ruleId: string;
  ruleSetVersion: string;
  name: string;
  sectionReference: string;    // e.g. "Rule 6(1)(a) Legal Metrology PC Rules, 2011"
  category: string;
  description: string;
  severity: RuleSeverity;
  active: boolean;
  expectedRequirement: string;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  sectionReference: string;
  severity: RuleSeverity;
  status: RuleStatus;
  confidence: number;
  detectedValue: string | null;
  expectedRequirement: string;
  explanation: string;
  evidenceSnippet?: string;
  evidenceBox?: BoundingBox;
}

export interface ComplianceSummary {
  overallStatus: RuleStatus;
  score: number;               // 0 - 100
  totalRulesEvaluated: number;
  compliantCount: number;
  flaggedCount: number;
  reviewCount: number;
  ruleSetVersion: string;
  evaluatedAt: string;
  disclaimer: string;
}

export interface FullScanAnalysis {
  declarations: Record<DeclarationType, ExtractedDeclaration>;
  ruleResults: RuleEvaluationResult[];
  fontAnalysis: FontAnalysisResult;
  summary: ComplianceSummary;
  ocrText: string;
  ocrProvider?: string;
  ocrRegions?: OCRRegion[];
  imageQuality?: ImageQualityMetrics;
  imageDimensions?: { width: number; height: number };
  fingerprint: {
    brand?: string;
    productName?: string;
    netQty?: string;
    mrp?: string;
  };
}
