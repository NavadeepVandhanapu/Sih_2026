export type Role = 'CONSUMER' | 'COMPANY' | 'GOVERNMENT_OFFICER' | 'ADMIN';
export type UserRole = Role;

export type RuleStatus =
  | 'COMPLIANT'
  | 'POTENTIAL_NON_COMPLIANCE'
  | 'MANUAL_REVIEW_RECOMMENDED'
  | 'NOT_APPLICABLE';

export type ComplaintStatus =
  | 'SUBMITTED'
  | 'UNDER_COMPANY_REVIEW'
  | 'COMPANY_RESPONDED'
  | 'ESCALATED'
  | 'UNDER_GOVERNMENT_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'RESOLVED'
  | 'CLOSED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId?: string;
  designation?: string;
  department?: string;
  phone?: string;
  company?: Company;
}

export interface Company {
  id: string;
  name: string;
  registrationNo: string;
  category: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  address: string;
  state: string;
  complianceRate: number;
  activeComplaintsCount: number;
  totalProductsCount: number;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  brand: string;
  category: string;
  barcode?: string;
  standardNetQuantity?: string;
  standardMrp?: string;
  totalScans: number;
  potentialIssuesCount: number;
  verifiedViolationsCount: number;
  complianceStatus: string;
  sampleImageUrl?: string;
}

export interface BoundingBox {
  x: number;
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
  blur: number;
  brightness: number;
  contrast: number;
  resolution: 'GOOD' | 'ADEQUATE' | 'POOR';
}

export interface ExtractedDeclaration {
  type: string;
  label: string;
  detectedValue: string | null;
  confidence: number;
  rawSnippet?: string;
  notes?: string;
  evidenceBox?: BoundingBox;
  evidenceRegions?: BoundingBox[];
}

export interface RuleEvaluation {
  ruleId: string;
  ruleName: string;
  ruleVersion?: string;
  sectionReference: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: RuleStatus;
  confidence: number;
  detectedValue: string | null;
  expectedRequirement: string;
  explanation: string;
  evidenceSnippet?: string;
  evidenceBox?: BoundingBox;
  evidenceRegions?: BoundingBox[];
  officialSource?: string;
}

export interface Finding {
  id: string;
  ruleId: string;
  ruleVersion: string;
  declarationType?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
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

export interface FontAnalysis {
  estimatedCharHeightMm: number;
  requiredMinimumMm: number;
  calibrationMethod: string;
  packageHeightMm?: number;
  packageWidthMm?: number;
  status: RuleStatus;
  confidence: number;
  explanation: string;
}

export interface ComplianceSummary {
  overallStatus: RuleStatus;
  score: number; // Compliance Screening Score (0-100)
  aiConfidence?: number; // AI Model Confidence %
  totalRulesEvaluated: number;
  compliantCount: number;
  flaggedCount: number;
  reviewCount: number;
  notApplicableCount?: number;
  ruleSetVersion: string;
  evaluatedAt: string;
  disclaimer: string;
}

export interface ScanResult {
  scanId: string;
  imagePath: string;
  product?: Product;
  analysis: {
    declarations: Record<string, ExtractedDeclaration>;
    ruleResults: RuleEvaluation[];
    findings?: Finding[];
    fontAnalysis: FontAnalysis;
    summary: ComplianceSummary;
    ocrText: string;
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
  };
}

export interface Complaint {
  id: string;
  scanId: string;
  consumerId: string;
  companyId: string;
  productId?: string;
  status: ComplaintStatus;
  consumerNotes?: string;
  consumerLocation?: string;
  purchaseStore?: string;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  product?: Product;
  scan?: any;
  declarations?: any[];
  ruleEvaluations?: any[];
  companyResponse?: {
    responseText: string;
    correctiveActionType?: string;
    correctedLabelImageUrl?: string;
    batchNumber?: string;
    submittedAt: string;
  };
  governmentReview?: {
    officerName: string;
    decision: string;
    officerNotes: string;
    penaltyNoticeSection?: string;
    penaltyAmount?: number;
    reviewDate: string;
  };
}

export interface Inspection {
  id: string;
  complaintId?: string;
  companyId: string;
  assignedOfficerId: string;
  assignedOfficerName: string;
  facilityAddress: string;
  scheduledDate: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  findingsSummary?: string;
  enforcementAction?: string;
  createdAt: string;
  company?: Company;
}
