import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(), // 'CONSUMER' | 'COMPANY' | 'GOVERNMENT_OFFICER' | 'ADMIN'
  companyId: text('company_id'),
  phone: text('phone'),
  designation: text('designation'),
  department: text('department'),
  createdAt: text('created_at').notNull(),
});

export const companies = sqliteTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  registrationNo: text('registration_no').notNull().unique(),
  category: text('category').notNull(), // Food, Cosmetics, Household, Electronics
  riskScore: integer('risk_score').notNull().default(20), // 0 - 100
  riskLevel: text('risk_level').notNull().default('LOW'), // 'LOW' | 'MEDIUM' | 'HIGH'
  address: text('address').notNull(),
  state: text('state').notNull(),
  complianceRate: integer('compliance_rate').notNull().default(90),
  activeComplaintsCount: integer('active_complaints_count').notNull().default(0),
  totalProductsCount: integer('total_products_count').notNull().default(0),
  createdAt: text('created_at').notNull(),
});

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  companyId: text('company_id').notNull(),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  category: text('category').notNull(),
  barcode: text('barcode'),
  standardNetQuantity: text('standard_net_quantity'),
  standardMrp: text('standard_mrp'),
  totalScans: integer('total_scans').notNull().default(0),
  potentialIssuesCount: integer('potential_issues_count').notNull().default(0),
  verifiedViolationsCount: integer('verified_violations_count').notNull().default(0),
  complianceStatus: text('compliance_status').notNull().default('COMPLIANT'),
  sampleImageUrl: text('sample_image_url'),
  createdAt: text('created_at').notNull(),
});

export const scans = sqliteTable('scans', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  productId: text('product_id'),
  imagePath: text('image_path').notNull(),
  originalFileName: text('original_file_name'),
  status: text('status').notNull(), // 'COMPLIANT' | 'POTENTIAL_NON_COMPLIANCE' | 'MANUAL_REVIEW_RECOMMENDED'
  overallScore: integer('overall_score').notNull(),
  ruleSetVersion: text('rule_set_version').notNull(),
  ocrText: text('ocr_text').notNull(),
  ocrConfidence: real('ocr_confidence').notNull(),
  fontAnalysisJson: text('font_analysis_json').notNull(),
  summaryJson: text('summary_json').notNull(),
  brandDetected: text('brand_detected'),
  productNameDetected: text('product_name_detected'),
  createdAt: text('created_at').notNull(),
});

export const declarations = sqliteTable('declarations', {
  id: text('id').primaryKey(),
  scanId: text('scan_id').notNull(),
  declarationType: text('declaration_type').notNull(),
  label: text('label').notNull(),
  detectedValue: text('detected_value'),
  confidence: real('confidence').notNull(),
  rawSnippet: text('raw_snippet'),
  notes: text('notes'),
});

export const ruleEvaluations = sqliteTable('rule_evaluations', {
  id: text('id').primaryKey(),
  scanId: text('scan_id').notNull(),
  ruleId: text('rule_id').notNull(),
  ruleName: text('rule_name').notNull(),
  sectionReference: text('section_reference').notNull(),
  severity: text('severity').notNull(),
  status: text('status').notNull(),
  confidence: real('confidence').notNull(),
  detectedValue: text('detected_value'),
  expectedRequirement: text('expected_requirement').notNull(),
  explanation: text('explanation').notNull(),
  evidenceSnippet: text('evidence_snippet'),
});

export const complaints = sqliteTable('complaints', {
  id: text('id').primaryKey(), // e.g. "LM-2026-001284"
  scanId: text('scan_id').notNull(),
  consumerId: text('consumer_id').notNull(),
  companyId: text('company_id').notNull(),
  productId: text('product_id'),
  status: text('status').notNull(), // 'SUBMITTED' | 'UNDER_COMPANY_REVIEW' | 'COMPANY_RESPONDED' | 'ESCALATED' | 'UNDER_GOVERNMENT_REVIEW' | 'VERIFIED' | 'REJECTED' | 'RESOLVED' | 'CLOSED'
  consumerNotes: text('consumer_notes'),
  consumerLocation: text('consumer_location'),
  purchaseStore: text('purchase_store'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const companyResponses = sqliteTable('company_responses', {
  id: text('id').primaryKey(),
  complaintId: text('complaint_id').notNull(),
  companyId: text('company_id').notNull(),
  responseText: text('response_text').notNull(),
  correctiveActionType: text('corrective_action_type'), // 'PACKAGING_REVISION' | 'RECALL_BATCH' | 'INTERNAL_AUDIT' | 'DISPUTED'
  correctedLabelImageUrl: text('corrected_label_image_url'),
  batchNumber: text('batch_number'),
  submittedAt: text('submitted_at').notNull(),
});

export const governmentReviews = sqliteTable('government_reviews', {
  id: text('id').primaryKey(),
  complaintId: text('complaint_id').notNull(),
  officerId: text('officer_id').notNull(),
  officerName: text('officer_name').notNull(),
  decision: text('decision').notNull(), // 'VERIFIED_VIOLATION' | 'REJECTED' | 'INSPECTION_ORDERED' | 'REQUEST_MORE_EVIDENCE'
  officerNotes: text('officer_notes').notNull(),
  penaltyNoticeSection: text('penalty_notice_section'),
  penaltyAmount: real('penalty_amount'),
  reviewDate: text('review_date').notNull(),
});

export const inspections = sqliteTable('inspections', {
  id: text('id').primaryKey(),
  complaintId: text('complaint_id'),
  companyId: text('company_id').notNull(),
  assignedOfficerId: text('assigned_officer_id').notNull(),
  assignedOfficerName: text('assigned_officer_name').notNull(),
  facilityAddress: text('facility_address').notNull(),
  scheduledDate: text('scheduled_date').notNull(),
  status: text('status').notNull(), // 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  findingsSummary: text('findings_summary'),
  enforcementAction: text('enforcement_action'), // 'NOTICE_ISSUED' | 'COMPOUNDED' | 'SEIZED' | 'CLEARED'
  reportPdfPath: text('report_pdf_path'),
  createdAt: text('created_at').notNull(),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  actorId: text('actor_id').notNull(),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  detailsJson: text('details_json'),
  timestamp: text('timestamp').notNull(),
});
