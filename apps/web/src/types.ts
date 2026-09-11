export type Role = 'CONSUMER' | 'COMPANY' | 'GOVERNMENT_OFFICER' | 'ADMIN';

export type RuleStatus =
  | 'COMPLIANT'
  | 'POTENTIAL_NON_COMPLIANCE'
  | 'MANUAL_REVIEW_RECOMMENDED';

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

export interface ExtractedDeclaration {
  type: string;
  label: string;
  detectedValue: string | null;
  confidence: number;
  rawSnippet?: string;
  notes?: string;
}

export interface RuleEvaluation {
  ruleId: string;
  ruleName: string;
  sectionReference: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  status: RuleStatus;
  confidence: number;
  detectedValue: string | null;
  expectedRequirement: string;
  explanation: string;
  evidenceSnippet?: string;
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
  score: number;
  totalRulesEvaluated: number;
  compliantCount: number;
  flaggedCount: number;
  reviewCount: number;
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
    fontAnalysis: FontAnalysis;
    summary: ComplianceSummary;
    ocrText: string;
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
