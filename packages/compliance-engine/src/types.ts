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
  | 'MANUAL_REVIEW_RECOMMENDED'
  | 'NOT_APPLICABLE';

export type RuleSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type Jurisdiction = 'CENTRAL' | 'STATE' | 'COMMODITY_SPECIFIC';

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

export interface NormalizedMRP {
  numericValue: number | null;
  currency: 'INR' | string;
  taxInclusive: boolean;
  formattedDisplay: string;
}

export interface NormalizedNetQuantity {
  numericValue: number | null;
  unit: string | null;
  normalizedKgOrL: number | null;
  normalizedUnit: 'kg' | 'l' | 'g' | 'ml' | 'units' | null;
  isStandardMetric: boolean;
}

export interface NormalizedMfgDate {
  month: number | null;
  year: number | null;
  rawFormat: string | null;
  isoDateString: string | null;
}

export interface NormalizedConsumerCare {
  email: string | null;
  phone: string | null;
  address: string | null;
  hasMultiChannel: boolean;
}

export interface NormalizedUnitSalePrice {
  pricePerUnit: number | null;
  unit: string | null;
  formattedDisplay: string | null;
}

export interface NormalizedCountryOfOrigin {
  country: string | null;
  isDomestic: boolean;
}

export type NormalizedValue =
  | NormalizedMRP
  | NormalizedNetQuantity
  | NormalizedMfgDate
  | NormalizedConsumerCare
  | NormalizedUnitSalePrice
  | NormalizedCountryOfOrigin
  | Record<string, any>;

export interface ExtractedDeclaration {
  type: DeclarationType;
  label: string;
  detectedValue: string | null;
  rawText?: string;
  rawSnippet?: string;
  normalized?: NormalizedValue;
  confidence: number;          // overall derived confidence (0.0 - 1.0)
  ocrConfidence?: number;      // raw EasyOCR model confidence
  extractionConfidence?: number; // pattern match confidence
  overallConfidence?: number;  // overall derived confidence
  boundingBox?: BoundingBox;
  evidenceRegions?: BoundingBox[];
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

export interface OfficialSourceMetadata {
  authority: string;
  documentName: string;
  ruleNumber: string;
  publicationDate?: string;
  referenceUrl?: string;
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
  version: string;
  effectiveFrom: string;       // YYYY-MM-DD
  effectiveUntil?: string;     // YYYY-MM-DD
  jurisdiction: Jurisdiction;
  sourceMetadata: OfficialSourceMetadata;
  applicableCategories?: string[]; // e.g. ["Food", "Cosmetics", "Household", "ALL"]
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  ruleVersion: string;
  sectionReference: string;
  severity: RuleSeverity;
  status: RuleStatus;
  confidence: number;
  detectedValue: string | null;
  expectedRequirement: string;
  explanation: string;
  evidenceSnippet?: string;
  evidenceBox?: BoundingBox;
  evidenceRegions?: BoundingBox[];
  officialSource?: string;
  findingId?: string;
}

export interface Finding {
  id: string;
  ruleId: string;
  ruleVersion: string;
  declarationType?: DeclarationType;
  severity: RuleSeverity;
  status: RuleStatus;
  title: string;
  explanation: string;
  confidence: number;
  evidenceSnippet?: string;
  evidenceRegions: BoundingBox[];
  officialSource: string;
}

export interface ImageIntegrityMetadata {
  sha256Hash: string;
  fileSizeBytes: number;
  mimeType: string;
  width: number;
  height: number;
  timestamp: string;
}

export interface ComplianceSummary {
  overallStatus: RuleStatus;
  score: number;               // 0 - 100 Compliance Screening Score
  aiConfidence: number;        // Average AI Model Detection Confidence %
  totalRulesEvaluated: number;
  compliantCount: number;
  flaggedCount: number;
  reviewCount: number;
  notApplicableCount: number;
  ruleSetVersion: string;
  evaluatedAt: string;
  disclaimer: string;
}

export interface FullScanAnalysis {
  declarations: Record<DeclarationType, ExtractedDeclaration>;
  ruleResults: RuleEvaluationResult[];
  findings: Finding[];
  fontAnalysis: FontAnalysisResult;
  summary: ComplianceSummary;
  ocrText: string;
  ocrProvider?: string;
  ocrRegions?: OCRRegion[];
  imageQuality?: ImageQualityMetrics;
  imageDimensions?: { width: number; height: number };
  imageIntegrity?: ImageIntegrityMetadata;
  fingerprint: {
    brand?: string;
    productName?: string;
    netQty?: string;
    mrp?: string;
  };
}
