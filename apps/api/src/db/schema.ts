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
  parentScanId: text('parent_scan_id'),
  imagePath: text('image_path').notNull(),
  originalFileName: text('original_file_name'),
  sha256Hash: text('sha256_hash'),
  status: text('status').notNull(), // 'COMPLIANT' | 'POTENTIAL_NON_COMPLIANCE' | 'MANUAL_REVIEW_RECOMMENDED'
  overallScore: integer('overall_score').notNull(),
  aiConfidence: integer('ai_confidence').default(92),
  ruleSetVersion: text('rule_set_version').notNull(),
  ocrText: text('ocr_text').notNull(),
  ocrConfidence: real('ocr_confidence').notNull(),
  ocrProvider: text('ocr_provider').default('PyTorch EasyOCR Neural Engine (v1.7)'),
  ocrRegionsJson: text('ocr_regions_json'),
  imageQualityJson: text('image_quality_json'),
  imageWidth: integer('image_width'),
  imageHeight: integer('image_height'),
  fontAnalysisJson: text('font_analysis_json').notNull(),
  summaryJson: text('summary_json').notNull(),
  findingsJson: text('findings_json'),
  brandDetected: text('brand_detected'),
  productNameDetected: text('product_name_detected'),
  createdAt: text('created_at').notNull(),
});

export const scanImages = sqliteTable('scan_images', {
  id: text('id').primaryKey(),
  scanId: text('scan_id').notNull(),
  originalFileName: text('original_file_name').notNull(),
  storagePath: text('storage_path').notNull(),
  mimeType: text('mime_type').notNull(),
  sha256Hash: text('sha256_hash'),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  createdAt: text('created_at').notNull(),
});

export const ocrRegions = sqliteTable('ocr_regions', {
  id: text('id').primaryKey(),
  scanId: text('scan_id').notNull(),
  text: text('text').notNull(),
  confidence: real('confidence').notNull(),
  x: real('x').notNull(),
  y: real('y').notNull(),
  width: real('width').notNull(),
  height: real('height').notNull(),
  polygonJson: text('polygon_json'),
  engine: text('engine').notNull().default('PyTorch EasyOCR Neural Engine (v1.7)'),
});

export const ruleVersions = sqliteTable('rule_versions', {
  id: text('id').primaryKey(),
  ruleId: text('rule_id').notNull(),
  version: text('version').notNull(),
  name: text('name').notNull(),
  sectionReference: text('section_reference').notNull(),
  jurisdiction: text('jurisdiction').notNull().default('CENTRAL'),
  status: text('status').notNull().default('ACTIVE'), // 'DRAFT' | 'REVIEW' | 'ACTIVE' | 'RETIRED'
  effectiveFrom: text('effective_from').notNull(),
  effectiveUntil: text('effective_until'),
  sourceMetadataJson: text('source_metadata_json').notNull(),
  createdAt: text('created_at').notNull(),
});

export const declarations = sqliteTable('declarations', {
  id: text('id').primaryKey(),
  scanId: text('scan_id').notNull(),
  declarationType: text('declaration_type').notNull(),
  label: text('label').notNull(),
  detectedValue: text('detected_value'),
  rawText: text('raw_text'),
  normalizedJson: text('normalized_json'),
  confidence: real('confidence').notNull(),
  ocrConfidence: real('ocr_confidence'),
  extractionConfidence: real('extraction_confidence'),
  rawSnippet: text('raw_snippet'),
  notes: text('notes'),
  boundingBoxJson: text('bounding_box_json'),
  evidenceRegionsJson: text('evidence_regions_json'),
});

export const ruleEvaluations = sqliteTable('rule_evaluations', {
  id: text('id').primaryKey(),
  scanId: text('scan_id').notNull(),
  ruleId: text('rule_id').notNull(),
  ruleVersion: text('rule_version').notNull().default('2026.1'),
  ruleName: text('rule_name').notNull(),
  sectionReference: text('section_reference').notNull(),
  severity: text('severity').notNull(),
  status: text('status').notNull(), // 'COMPLIANT' | 'POTENTIAL_NON_COMPLIANCE' | 'MANUAL_REVIEW_RECOMMENDED' | 'NOT_APPLICABLE'
  confidence: real('confidence').notNull(),
  detectedValue: text('detected_value'),
  expectedRequirement: text('expected_requirement').notNull(),
  explanation: text('explanation').notNull(),
  evidenceSnippet: text('evidence_snippet'),
  evidenceBoxJson: text('evidence_box_json'),
  evidenceRegionsJson: text('evidence_regions_json'),
  officialSource: text('official_source'),
});

export const evidence = sqliteTable('evidence', {
  id: text('id').primaryKey(),
  scanId: text('scan_id').notNull(),
  imageId: text('image_id'),
  ruleId: text('rule_id').notNull(),
  declarationType: text('declaration_type'),
  sha256Hash: text('sha256_hash').notNull(),
  ocrRegionIdsJson: text('ocr_region_ids_json'),
  boundingBoxesJson: text('bounding_boxes_json').notNull(),
  createdAt: text('created_at').notNull(),
});

export const complaints = sqliteTable('complaints', {
  id: text('id').primaryKey(),
  scanId: text('scan_id').notNull(),
  consumerId: text('consumer_id').notNull(),
  companyId: text('company_id').notNull(),
  productId: text('product_id'),
  status: text('status').notNull(),
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
  correctiveActionType: text('corrective_action_type'),
  correctedLabelImageUrl: text('corrected_label_image_url'),
  batchNumber: text('batch_number'),
  submittedAt: text('submitted_at').notNull(),
});

export const governmentReviews = sqliteTable('government_reviews', {
  id: text('id').primaryKey(),
  complaintId: text('complaint_id').notNull(),
  officerId: text('officer_id').notNull(),
  officerName: text('officer_name').notNull(),
  decision: text('decision').notNull(),
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
  status: text('status').notNull(),
  findingsSummary: text('findings_summary'),
  enforcementAction: text('enforcement_action'),
  reportPdfPath: text('report_pdf_path'),
  createdAt: text('created_at').notNull(),
});

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('INFO'), // 'INFO' | 'WARNING' | 'ACTION_REQUIRED' | 'VIOLATION'
  read: integer('read').notNull().default(0),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
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
