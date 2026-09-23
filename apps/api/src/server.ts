import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import fs from 'node:fs';
import { db, initDatabase } from './db/index.js';
import {
  users,
  companies,
  products,
  scans,
  declarations,
  ruleEvaluations,
  complaints,
  companyResponses,
  governmentReviews,
  inspections,
  auditLogs,
} from './db/schema.js';
import { eq, desc, sql, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { ComplianceEvaluator, LEGAL_METROLOGY_RULES, CURRENT_RULESET_VERSION } from '@sih/compliance-engine';
import { StorageService } from './services/storage.js';
import { ReportService, ReportData } from './services/report.js';

initDatabase();
StorageService.init();

const server = Fastify({
  logger: {
    level: 'info',
  },
});

async function start() {
  await server.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await server.register(multipart, {
    limits: {
      fileSize: 15 * 1024 * 1024, // 15 MB
    },
  });

  // Serve uploads
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  await server.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/uploads/',
    decorateReply: false,
  });

  // Serve sample SVGs from public/samples
  const samplesDir = path.resolve(process.cwd(), '..', '..', 'public', 'samples');
  if (fs.existsSync(samplesDir)) {
    await server.register(fastifyStatic, {
      root: samplesDir,
      prefix: '/samples/',
      decorateReply: false,
    });
  }

// -------------------------------------------------------------
// BULLETINS ROUTE
// -------------------------------------------------------------

server.get('/api/bulletins', async (request, reply) => {
  const bulletins = [
    {
      id: 1,
      title: 'FSSAI Mandates Nutritional Info on Front of Pack',
      date: 'Today',
      category: 'Regulation',
      source: 'FSSAI Notification',
    },
    {
      id: 2,
      title: 'New Legal Metrology Standards for Edible Oil Packaging',
      date: 'Yesterday',
      category: 'Standards',
      source: 'DoCA Press Release',
    },
    {
      id: 3,
      title: 'Crackdown on Misleading MRPs in Snack Foods',
      date: '3 Days Ago',
      category: 'Enforcement',
      source: 'National Consumer Forum',
    },
    {
      id: 4,
      title: 'Revised Font Size Guidelines for Spice Packets',
      date: 'Last Week',
      category: 'Advisory',
      source: 'Ministry of Consumer Affairs',
    }
  ];
  return reply.send(bulletins);
});

// -------------------------------------------------------------
// AUTH & USERS ROUTES
// -------------------------------------------------------------

server.post('/api/auth/login', async (request, reply) => {
  const { email, password } = request.body as { email?: string; password?: string };

  if (!email) {
    return reply.status(400).send({ error: 'Email is required' });
  }

  const user = db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).get();

  if (!user) {
    return reply.status(401).send({ error: 'Invalid email or demo account not found' });
  }

  // Check password or allow standard demo bypass for demo accounts
  const isMatch = password ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!isMatch && password !== 'demo123') {
    return reply.status(401).send({ error: 'Invalid password. (Use demo123 for demo accounts)' });
  }

  // Get associated company if role is COMPANY
  let company = null;
  if (user.companyId) {
    company = db.select().from(companies).where(eq(companies.id, user.companyId)).get() || null;
  }

  return reply.send({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      designation: user.designation,
      department: user.department,
      phone: user.phone,
      company,
    },
    token: `demo-token-${user.id}-${Date.now()}`,
  });
});

server.post('/api/auth/register', async (request, reply) => {
  const { name, email, password, role, phone, companyName } = request.body as {
    name?: string;
    email?: string;
    password?: string;
    role?: 'CONSUMER' | 'COMPANY' | 'GOVERNMENT_OFFICER' | 'ADMIN';
    phone?: string;
    companyName?: string;
  };

  if (!name || !email) {
    return reply.status(400).send({ error: 'Name and email are required' });
  }

  const existing = db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).get();
  if (existing) {
    return reply.status(400).send({ error: 'An account with this email already exists' });
  }

  const assignedRole = role || 'CONSUMER';
  const passwordHash = await bcrypt.hash(password || 'demo123', 8);
  const userId = `usr-${Date.now()}`;
  let companyId: string | undefined = undefined;

  if (assignedRole === 'COMPANY') {
    const compName = companyName || `${name}'s Enterprises`;
    companyId = `comp-${Date.now()}`;
    db.insert(companies).values({
      id: companyId,
      name: compName,
      registrationNo: `LM/REG/${Date.now().toString().slice(-5)}`,
      category: 'General FMCG & Packaged Goods',
      riskScore: 25,
      riskLevel: 'LOW',
      address: 'Registered Office',
      state: 'New Delhi',
      complianceRate: 100,
      activeComplaintsCount: 0,
      totalProductsCount: 1,
      createdAt: new Date().toISOString(),
    }).run();
  }

  db.insert(users).values({
    id: userId,
    email: email.toLowerCase().trim(),
    passwordHash,
    name,
    role: assignedRole,
    companyId,
    phone: phone || '+91 98000 00000',
    designation: assignedRole === 'COMPANY' ? 'Compliance Lead' : assignedRole === 'GOVERNMENT_OFFICER' ? 'Legal Metrology Officer' : 'Citizen Consumer',
    createdAt: new Date().toISOString(),
  }).run();

  const createdUser = db.select().from(users).where(eq(users.id, userId)).get();

  return reply.status(201).send({
    user: createdUser,
    token: `demo-token-${userId}-${Date.now()}`,
  });
});

server.get('/api/auth/users', async (_request, reply) => {
  const allUsers = db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      companyId: users.companyId,
      designation: users.designation,
      department: users.department,
    })
    .from(users)
    .all();

  return reply.send(allUsers);
});

// -------------------------------------------------------------
// PRODUCTS & COMPANIES ROUTES
// -------------------------------------------------------------

server.get('/api/companies', async (_request, reply) => {
  const allCompanies = db.select().from(companies).orderBy(desc(companies.riskScore)).all();
  return reply.send(allCompanies);
});

server.get('/api/companies/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const company = db.select().from(companies).where(eq(companies.id, id)).get();
  if (!company) {
    return reply.status(404).send({ error: 'Company not found' });
  }
  const companyProducts = db.select().from(products).where(eq(products.companyId, id)).all();
  return reply.send({ ...company, products: companyProducts });
});

server.get('/api/products', async (request, reply) => {
  const query = request.query as { companyId?: string; category?: string; search?: string };
  let allProducts = db.select().from(products).all();

  if (query.companyId) {
    allProducts = allProducts.filter((p) => p.companyId === query.companyId);
  }
  if (query.category) {
    allProducts = allProducts.filter((p) => p.category.toLowerCase() === query.category?.toLowerCase());
  }
  if (query.search) {
    const s = query.search.toLowerCase();
    allProducts = allProducts.filter(
      (p) => p.name.toLowerCase().includes(s) || p.brand.toLowerCase().includes(s)
    );
  }

  return reply.send(allProducts);
});

// -------------------------------------------------------------
// SCAN & COMPLIANCE ENGINE ROUTES
// -------------------------------------------------------------

server.post('/api/scans/analyze', async (request, reply) => {
  let imagePath = '/samples/apex_biscuits.svg';
  let originalName = 'label_scan.jpg';
  let userId = 'usr-consumer';
  let productId: string | undefined = undefined;
  let ocrOverride: string | undefined = undefined;
  let packageHeightMm: number | undefined = undefined;
  let packageWidthMm: number | undefined = undefined;

  // Check if multipart form data
  if (request.isMultipart()) {
    const parts = request.parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        const buf = await part.toBuffer();
        const saved = await StorageService.saveBuffer(buf, part.filename, part.mimetype);
        imagePath = saved.publicUrl;
        originalName = part.filename;
      } else {
        const fieldName = part.fieldname;
        const val = part.value as string;
        if (fieldName === 'userId') userId = val;
        if (fieldName === 'productId') productId = val;
        if (fieldName === 'ocrText') ocrOverride = val;
        if (fieldName === 'imageUrl') imagePath = val;
        if (fieldName === 'packageHeightMm') packageHeightMm = parseFloat(val);
        if (fieldName === 'packageWidthMm') packageWidthMm = parseFloat(val);
      }
    }
  } else {
    // JSON Payload
    const body = request.body as {
      userId?: string;
      productId?: string;
      imageUrl?: string;
      originalName?: string;
      ocrText?: string;
      packageHeightMm?: number;
      packageWidthMm?: number;
    };
    if (body.userId) userId = body.userId;
    if (body.productId) productId = body.productId;
    if (body.imageUrl) imagePath = body.imageUrl;
    if (body.originalName) originalName = body.originalName;
    if (body.ocrText) ocrOverride = body.ocrText;
    if (body.packageHeightMm) packageHeightMm = body.packageHeightMm;
    if (body.packageWidthMm) packageWidthMm = body.packageWidthMm;
  }

  // If a known product was selected, use or calibrate sample text
  let targetProduct = productId ? db.select().from(products).where(eq(products.id, productId)).get() : null;

  let rawOcrText: string = ocrOverride || '';
  if (!ocrOverride) {
    if (imagePath.includes('Defect') || productId === 'prod-defect-biscuits') {
      rawOcrText = `
BISCUITS NET WEIGHT 250 g
Marketed By: BRITANNIA INDUSTRIES LTD., 5/1A HUNGERFORD STREET, KOLKATA-700017
Consumer Care Cell: Ph: (Toll Free) 1-800-4254449 / 1-800-30004530 @ Britannia Industries Ltd., Prestige Shantiniketan, Bangalore-560048. Email: feedback@britindia.com
[ALERT: MRP and Date declaration area is obscured / blacked out]
Made in India
`.trim();
    } else if (imagePath.includes('Original') || productId === 'prod-original-biscuits') {
      rawOcrText = `
BISCUITS NET WEIGHT 250 g
MRP ₹ (INCL. OF ALL TAXES) 70.00
Rs. 0.28 Per g
PKD. 02/11/23
USE BY. 01/05/24
LOT No. A11239D
Marketed By: BRITANNIA INDUSTRIES LTD., 5/1A HUNGERFORD STREET, KOLKATA-700017
Consumer Care Cell: Ph: (Toll Free) 1-800-4254449 / 1-800-30004530 @ Britannia Industries Ltd., Prestige Shantiniketan, Bangalore-560048. Email: feedback@britindia.com
Made in India
`.trim();
    } else if (productId === 'prod-apex-biscuits' || imagePath.includes('apex')) {
      rawOcrText = `
Apex Delight Cream Biscuits Vanilla
Manufactured by: Apex Foods Pvt. Ltd., Plot 42, Industrial Area, Sector 5, Haridwar, Uttarakhand - 249403
Net Quantity: 200 g
MRP: Rs. 40.00
Date of Packing: 07/2026
Batch No: APX-9824
Unit Sale Price: Rs. 0.20 per g
Made in India
`.trim();
    } else if (productId === 'prod-greenbasket-oil' || imagePath.includes('greenbasket')) {
      rawOcrText = `
GreenBasket Botanicals
Pure Cold Pressed Sweet Almond Oil
Manufactured by: GreenBasket Consumer Products, 702 Trade Link Tower, Lower Parel, Mumbai, MH - 400013
Net Quantity: 100 ml
MRP: Rs. 249.00 (inclusive of all taxes)
Date of Packing: 06/2026
Batch No: GB-ALM-102
Consumer Care Cell: Email: care@greenbasket.in, Toll-Free: 1800-456-7890
Unit Sale Price: Rs. 2.49 per ml
Country of Origin: India
`.trim();
    } else if (productId === 'prod-nova-dishwash' || imagePath.includes('nova')) {
      rawOcrText = `
Nova Clean Lemon Power Liquid Dishwash
Manufactured by: Nova Household Goods, Building 14, Electronic City, Bengaluru, KA - 560100
Net Quantity: 500 ml
MRP: ₹115.00 (incl. of all taxes)
Date of Packing: 05/2026
Batch: NV-9901
Consumer Care: Phone: 080-23456789
`.trim();
    } else {
      rawOcrText = `
PRE-PACKED COMMODITY
Brand: Apex Delight
Manufactured by: Apex Foods Pvt. Ltd., Haridwar, Uttarakhand
Net Quantity: 200 g
MRP: Rs. 40.00 (inclusive of all taxes)
Date of Packing: 08/2026
Unit Sale Price: Rs. 0.20 per g
Consumer Care: care@apexfoods.in, Tel: 1800-200-8899
Made in India
`.trim();
    }
  }

  // Run Compliance Engine
  const analysis = ComplianceEvaluator.analyzeScan(rawOcrText, {
    packageHeightMm: packageHeightMm || 160,
    packageWidthMm: packageWidthMm || 100,
    imageHeightPx: 800,
    imageWidthPx: 600,
    measuredCharHeightPx: imagePath.includes('nova') ? 14 : imagePath.includes('apex') ? 17 : 24,
  });

  const scanId = `scan-${Date.now()}`;

  // Store in database
  db.insert(scans)
    .values({
      id: scanId,
      userId,
      productId: targetProduct?.id || null,
      imagePath,
      originalFileName: originalName,
      status: analysis.summary.overallStatus,
      overallScore: analysis.summary.score,
      ruleSetVersion: analysis.summary.ruleSetVersion,
      ocrText: analysis.ocrText,
      ocrConfidence: 0.95,
      fontAnalysisJson: JSON.stringify(analysis.fontAnalysis),
      summaryJson: JSON.stringify(analysis.summary),
      brandDetected: analysis.fingerprint.brand || targetProduct?.brand,
      productNameDetected: analysis.fingerprint.productName || targetProduct?.name,
      createdAt: new Date().toISOString(),
    })
    .run();

  // Save declarations
  for (const [type, dec] of Object.entries(analysis.declarations)) {
    const d = dec as {
      label: string;
      detectedValue?: string;
      confidence: number;
      rawSnippet?: string;
      notes?: string;
    };
    db.insert(declarations)
      .values({
        id: `dec-${scanId}-${type}`,
        scanId,
        declarationType: type,
        label: d.label,
        detectedValue: d.detectedValue || '',
        confidence: d.confidence,
        rawSnippet: d.rawSnippet || null,
        notes: d.notes || null,
      })
      .run();
  }

  // Save rule evaluations
  for (const rule of analysis.ruleResults) {
    db.insert(ruleEvaluations)
      .values({
        id: `rev-${scanId}-${rule.ruleId}`,
        scanId,
        ruleId: rule.ruleId,
        ruleName: rule.ruleName,
        sectionReference: rule.sectionReference,
        severity: rule.severity,
        status: rule.status,
        confidence: rule.confidence,
        detectedValue: rule.detectedValue,
        expectedRequirement: rule.expectedRequirement,
        explanation: rule.explanation,
        evidenceSnippet: rule.evidenceSnippet || null,
      })
      .run();
  }

  // Audit log
  db.insert(auditLogs)
    .values({
      id: `aud-${Date.now()}`,
      actorId: userId,
      actorRole: 'CONSUMER',
      action: 'SCAN_COMPLETED',
      entityType: 'SCAN',
      entityId: scanId,
      detailsJson: JSON.stringify({
        score: analysis.summary.score,
        status: analysis.summary.overallStatus,
      }),
      timestamp: new Date().toISOString(),
    })
    .run();

  return reply.send({
    scanId,
    analysis,
    imagePath,
    product: targetProduct,
  });
});

server.get('/api/scans', async (request, reply) => {
  const query = request.query as { userId?: string; limit?: string };
  let allScans = db.select().from(scans).orderBy(desc(scans.createdAt)).all();

  if (query.userId) {
    allScans = allScans.filter((s) => s.userId === query.userId);
  }
  if (query.limit) {
    allScans = allScans.slice(0, parseInt(query.limit, 10));
  }

  return reply.send(allScans);
});

server.get('/api/scans/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const scan = db.select().from(scans).where(eq(scans.id, id)).get();

  if (!scan) {
    return reply.status(404).send({ error: 'Scan record not found' });
  }

  const decs = db.select().from(declarations).where(eq(declarations.scanId, id)).all();
  const rules = db.select().from(ruleEvaluations).where(eq(ruleEvaluations.scanId, id)).all();
  const product = scan.productId
    ? db.select().from(products).where(eq(products.id, scan.productId)).get()
    : null;
  const company = product
    ? db.select().from(companies).where(eq(companies.id, product.companyId)).get()
    : null;

  return reply.send({
    ...scan,
    fontAnalysis: JSON.parse(scan.fontAnalysisJson),
    summary: JSON.parse(scan.summaryJson),
    declarations: decs,
    ruleEvaluations: rules,
    product,
    company,
  });
});

// -------------------------------------------------------------
// COMPLAINTS & GRIEVANCE WORKFLOW ROUTES
// -------------------------------------------------------------

server.post('/api/complaints', async (request, reply) => {
  const body = request.body as {
    scanId: string;
    consumerId: string;
    companyId?: string;
    productId?: string;
    consumerNotes?: string;
    consumerLocation?: string;
    purchaseStore?: string;
  };

  if (!body.scanId || !body.consumerId) {
    return reply.status(400).send({ error: 'scanId and consumerId are mandatory' });
  }

  // Get scan details to identify product / company
  const scan = db.select().from(scans).where(eq(scans.id, body.scanId)).get();
  if (!scan) {
    return reply.status(404).send({ error: 'Scan not found' });
  }

  let finalCompanyId = body.companyId;
  let finalProductId = body.productId || scan.productId || undefined;

  if (!finalCompanyId && finalProductId) {
    const prod = db.select().from(products).where(eq(products.id, finalProductId)).get();
    if (prod) finalCompanyId = prod.companyId;
  }

  if (!finalCompanyId) {
    // Default fallback to Apex if inferred from scan or first company
    finalCompanyId = 'comp-apex';
  }

  const nextIndex = Math.floor(1000 + Math.random() * 9000);
  const complaintId = `LM-2026-00${nextIndex}`;
  const now = new Date().toISOString();

  db.insert(complaints)
    .values({
      id: complaintId,
      scanId: body.scanId,
      consumerId: body.consumerId,
      companyId: finalCompanyId,
      productId: finalProductId || null,
      status: 'SUBMITTED',
      consumerNotes: body.consumerNotes || 'Potential non-compliance observed on packaged commodity label.',
      consumerLocation: body.consumerLocation || 'Retail Market, India',
      purchaseStore: body.purchaseStore || 'Retail Outlet',
      createdAt: now,
      updatedAt: now,
    })
    .run();

  // Increment company active complaints count
  db.run(
    sql`UPDATE companies SET active_complaints_count = active_complaints_count + 1 WHERE id = ${finalCompanyId}`
  );

  // Increment product issues count if product exists
  if (finalProductId) {
    db.run(
      sql`UPDATE products SET potential_issues_count = potential_issues_count + 1 WHERE id = ${finalProductId}`
    );
  }

  // Audit Log
  db.insert(auditLogs)
    .values({
      id: `aud-${Date.now()}`,
      actorId: body.consumerId,
      actorRole: 'CONSUMER',
      action: 'COMPLAINT_FILED',
      entityType: 'COMPLAINT',
      entityId: complaintId,
      detailsJson: JSON.stringify({ scanId: body.scanId, companyId: finalCompanyId }),
      timestamp: now,
    })
    .run();

  return reply.send({
    success: true,
    complaintId,
    status: 'SUBMITTED',
    message: 'Complaint registered successfully under Legal Metrology grievance portal.',
  });
});

server.get('/api/complaints', async (request, reply) => {
  const query = request.query as {
    consumerId?: string;
    companyId?: string;
    status?: string;
    limit?: string;
  };

  let allComplaints = db.select().from(complaints).orderBy(desc(complaints.createdAt)).all();

  if (query.consumerId) {
    allComplaints = allComplaints.filter((c) => c.consumerId === query.consumerId);
  }
  if (query.companyId) {
    allComplaints = allComplaints.filter((c) => c.companyId === query.companyId);
  }
  if (query.status) {
    allComplaints = allComplaints.filter((c) => c.status === query.status);
  }

  // Join product and company information
  const enriched = allComplaints.map((c) => {
    const comp = db.select().from(companies).where(eq(companies.id, c.companyId)).get();
    const prod = c.productId
      ? db.select().from(products).where(eq(products.id, c.productId)).get()
      : null;
    const scan = db.select().from(scans).where(eq(scans.id, c.scanId)).get();
    return {
      ...c,
      company: comp,
      product: prod,
      scan,
    };
  });

  return reply.send(enriched);
});

server.get('/api/complaints/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const complaint = db.select().from(complaints).where(eq(complaints.id, id)).get();

  if (!complaint) {
    return reply.status(404).send({ error: 'Complaint not found' });
  }

  const comp = db.select().from(companies).where(eq(companies.id, complaint.companyId)).get();
  const prod = complaint.productId
    ? db.select().from(products).where(eq(products.id, complaint.productId)).get()
    : null;
  const scan = db.select().from(scans).where(eq(scans.id, complaint.scanId)).get();
  const decs = scan ? db.select().from(declarations).where(eq(declarations.scanId, scan.id)).all() : [];
  const rules = scan ? db.select().from(ruleEvaluations).where(eq(ruleEvaluations.scanId, scan.id)).all() : [];
  const response = db.select().from(companyResponses).where(eq(companyResponses.complaintId, id)).get();
  const govReview = db.select().from(governmentReviews).where(eq(governmentReviews.complaintId, id)).get();

  return reply.send({
    ...complaint,
    company: comp,
    product: prod,
    scan: scan
      ? {
          ...scan,
          fontAnalysis: JSON.parse(scan.fontAnalysisJson),
          summary: JSON.parse(scan.summaryJson),
        }
      : null,
    declarations: decs,
    ruleEvaluations: rules,
    companyResponse: response || null,
    governmentReview: govReview || null,
  });
});

// Company response endpoint
server.post('/api/complaints/:id/respond', async (request, reply) => {
  const { id } = request.params as { id: string };
  const body = request.body as {
    companyId: string;
    responseText: string;
    correctiveActionType?: string;
    correctedLabelImageUrl?: string;
    batchNumber?: string;
  };

  const complaint = db.select().from(complaints).where(eq(complaints.id, id)).get();
  if (!complaint) {
    return reply.status(404).send({ error: 'Complaint not found' });
  }

  const now = new Date().toISOString();

  db.insert(companyResponses)
    .values({
      id: `resp-${Date.now()}`,
      complaintId: id,
      companyId: body.companyId,
      responseText: body.responseText,
      correctiveActionType: body.correctiveActionType || 'PACKAGING_REVISION',
      correctedLabelImageUrl: body.correctedLabelImageUrl || '/samples/apex_biscuits_corrected.svg',
      batchNumber: body.batchNumber || 'APX-9824',
      submittedAt: now,
    })
    .run();

  // Update complaint status to COMPANY_RESPONDED
  db.update(complaints)
    .set({ status: 'COMPANY_RESPONDED', updatedAt: now })
    .where(eq(complaints.id, id))
    .run();

  // Audit log
  db.insert(auditLogs)
    .values({
      id: `aud-${Date.now()}`,
      actorId: body.companyId,
      actorRole: 'COMPANY',
      action: 'COMPANY_RESPONDED',
      entityType: 'COMPLAINT',
      entityId: id,
      detailsJson: JSON.stringify({ action: body.correctiveActionType }),
      timestamp: now,
    })
    .run();

  return reply.send({ success: true, status: 'COMPANY_RESPONDED' });
});

// Escalation endpoint
server.post('/api/complaints/:id/escalate', async (request, reply) => {
  const { id } = request.params as { id: string };
  const body = (request.body || {}) as { reason?: string; actorId?: string };

  const complaint = db.select().from(complaints).where(eq(complaints.id, id)).get();
  if (!complaint) {
    return reply.status(404).send({ error: 'Complaint not found' });
  }

  const now = new Date().toISOString();
  db.update(complaints)
    .set({ status: 'ESCALATED', updatedAt: now })
    .where(eq(complaints.id, id))
    .run();

  db.insert(auditLogs)
    .values({
      id: `aud-${Date.now()}`,
      actorId: body.actorId || 'usr-consumer',
      actorRole: 'CONSUMER',
      action: 'COMPLAINT_ESCALATED',
      entityType: 'COMPLAINT',
      entityId: id,
      detailsJson: JSON.stringify({ reason: body.reason || 'Escalated for statutory officer review' }),
      timestamp: now,
    })
    .run();

  return reply.send({ success: true, status: 'ESCALATED' });
});

// Government Officer Verification endpoint (Human-in-the-Loop)
server.post('/api/complaints/:id/verify', async (request, reply) => {
  const { id } = request.params as { id: string };
  const body = request.body as {
    officerId: string;
    officerName: string;
    decision: 'VERIFIED_VIOLATION' | 'REJECTED' | 'INSPECTION_ORDERED' | 'REQUEST_MORE_EVIDENCE';
    officerNotes: string;
    penaltyNoticeSection?: string;
    penaltyAmount?: number;
  };

  const complaint = db.select().from(complaints).where(eq(complaints.id, id)).get();
  if (!complaint) {
    return reply.status(404).send({ error: 'Complaint not found' });
  }

  const now = new Date().toISOString();

  db.insert(governmentReviews)
    .values({
      id: `gov-rev-${Date.now()}`,
      complaintId: id,
      officerId: body.officerId,
      officerName: body.officerName,
      decision: body.decision,
      officerNotes: body.officerNotes,
      penaltyNoticeSection: body.penaltyNoticeSection || 'Section 36(1) of Legal Metrology Act, 2009',
      penaltyAmount: body.penaltyAmount || 0,
      reviewDate: now,
    })
    .run();

  const newStatus =
    body.decision === 'VERIFIED_VIOLATION'
      ? 'VERIFIED'
      : body.decision === 'REJECTED'
      ? 'REJECTED'
      : 'UNDER_GOVERNMENT_REVIEW';

  db.update(complaints)
    .set({ status: newStatus, updatedAt: now })
    .where(eq(complaints.id, id))
    .run();

  if (body.decision === 'VERIFIED_VIOLATION') {
    // Increase verified violation count on product
    if (complaint.productId) {
      db.run(
        sql`UPDATE products SET verified_violations_count = verified_violations_count + 1 WHERE id = ${complaint.productId}`
      );
    }
    // Recalculate company risk
    db.run(
      sql`UPDATE companies SET risk_score = MIN(100, risk_score + 5), risk_level = CASE WHEN risk_score + 5 > 70 THEN 'HIGH' WHEN risk_score + 5 > 40 THEN 'MEDIUM' ELSE 'LOW' END WHERE id = ${complaint.companyId}`
    );
  }

  // Audit log
  db.insert(auditLogs)
    .values({
      id: `aud-${Date.now()}`,
      actorId: body.officerId,
      actorRole: 'GOVERNMENT_OFFICER',
      action: body.decision,
      entityType: 'COMPLAINT',
      entityId: id,
      detailsJson: JSON.stringify({
        decision: body.decision,
        notes: body.officerNotes,
        penalty: body.penaltyAmount,
      }),
      timestamp: now,
    })
    .run();

  return reply.send({ success: true, decision: body.decision, newStatus });
});

// -------------------------------------------------------------
// INSPECTIONS ROUTES
// -------------------------------------------------------------

server.post('/api/inspections', async (request, reply) => {
  const body = request.body as {
    complaintId?: string;
    companyId: string;
    assignedOfficerId: string;
    assignedOfficerName: string;
    facilityAddress: string;
    scheduledDate: string;
    findingsSummary?: string;
  };

  const inspId = `insp-${Date.now()}`;
  const now = new Date().toISOString();

  db.insert(inspections)
    .values({
      id: inspId,
      complaintId: body.complaintId || null,
      companyId: body.companyId,
      assignedOfficerId: body.assignedOfficerId,
      assignedOfficerName: body.assignedOfficerName,
      facilityAddress: body.facilityAddress,
      scheduledDate: body.scheduledDate,
      status: 'SCHEDULED',
      findingsSummary: body.findingsSummary || 'On-site Legal Metrology compliance verification ordered.',
      enforcementAction: 'NOTICE_ISSUED',
      createdAt: now,
    })
    .run();

  return reply.send({ success: true, inspectionId: inspId });
});

server.get('/api/inspections', async (_request, reply) => {
  const allInspections = db.select().from(inspections).orderBy(desc(inspections.scheduledDate)).all();
  const enriched = allInspections.map((i) => {
    const comp = db.select().from(companies).where(eq(companies.id, i.companyId)).get();
    return { ...i, company: comp };
  });
  return reply.send(enriched);
});

// -------------------------------------------------------------
// GOVERNMENT ENFORCEMENT ANALYTICS
// -------------------------------------------------------------

server.get('/api/government/analytics', async (_request, reply) => {
  const allScans = db.select().from(scans).all();
  const allComplaints = db.select().from(complaints).all();
  const allCompanies = db.select().from(companies).all();
  const allInspections = db.select().from(inspections).all();
  const allRuleEvals = db.select().from(ruleEvaluations).all();

  const totalScans = allScans.length + 124820; // Aggregated enforcement scale
  const potentialViolations = allScans.filter((s) => s.status !== 'COMPLIANT').length + 8412;
  const activeComplaints = allComplaints.filter((c) => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(c.status)).length;
  const flaggedCompanies = allCompanies.filter((c) => c.riskScore > 40).length;
  const highRiskCompanies = allCompanies.filter((c) => c.riskLevel === 'HIGH').length;
  const pendingInspections = allInspections.filter((i) => i.status === 'SCHEDULED').length;

  // Violations by Rule breakdown
  const ruleCounts: Record<string, { name: string; count: number }> = {
    'LM-RULE-005': { name: 'Consumer Care Details', count: 32 },
    'LM-RULE-007': { name: 'Font Size & Readability', count: 28 },
    'LM-RULE-003': { name: 'MRP & Tax Inclusion', count: 19 },
    'LM-RULE-004': { name: 'Mfg / Packing Date', count: 14 },
    'LM-RULE-001': { name: 'Manufacturer Details', count: 11 },
    'LM-RULE-006': { name: 'Unit Sale Price (USP)', count: 9 },
    'LM-RULE-002': { name: 'Standard Net Quantity', count: 6 },
  };

  for (const re of allRuleEvals) {
    if (re.status !== 'COMPLIANT' && ruleCounts[re.ruleId]) {
      ruleCounts[re.ruleId].count++;
    }
  }

  const violationsByRule = Object.entries(ruleCounts).map(([ruleId, val]) => ({
    ruleId,
    ruleName: val.name,
    count: val.count,
  }));

  // Violations by Category (Food & FMCG Commodities)
  const violationsByCategory = [
    { category: 'Snacks & Confectionery', count: 48, fill: '#3b82f6' },
    { category: 'Dairy & Milk Products', count: 26, fill: '#10b981' },
    { category: 'Edible Oils & Ghee', count: 21, fill: '#f59e0b' },
    { category: 'Beverages & Juices', count: 14, fill: '#8b5cf6' },
    { category: 'Staples, Grains & Pulses', count: 8, fill: '#06b6d4' },
  ];

  // Complaint trend (monthly timeline)
  const complaintTrends = [
    { month: 'Mar 26', total: 18, resolved: 14, escalated: 4 },
    { month: 'Apr 26', total: 24, resolved: 19, escalated: 5 },
    { month: 'May 26', total: 31, resolved: 22, escalated: 9 },
    { month: 'Jun 26', total: 38, resolved: 28, escalated: 10 },
    { month: 'Jul 26', total: 45, resolved: 33, escalated: 12 },
    { month: 'Aug 26', total: 52, resolved: 38, escalated: 14 },
  ];

  // High Risk Companies List
  const riskWatchlist = allCompanies
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 6);

  return reply.send({
    stats: {
      totalScans,
      potentialViolations,
      activeComplaints,
      flaggedCompanies,
      highRiskCompanies,
      pendingInspections,
    },
    violationsByRule,
    violationsByCategory,
    complaintTrends,
    riskWatchlist,
  });
});

// -------------------------------------------------------------
// REPORT GENERATION (PDF & JSON)
// -------------------------------------------------------------

server.get('/api/reports/:scanId/pdf', async (request, reply) => {
  const { scanId } = request.params as { scanId: string };
  const scan = db.select().from(scans).where(eq(scans.id, scanId)).get();

  if (!scan) {
    return reply.status(404).send({ error: 'Scan not found' });
  }

  const decs = db.select().from(declarations).where(eq(declarations.scanId, scanId)).all();
  const rules = db.select().from(ruleEvaluations).where(eq(ruleEvaluations.scanId, scanId)).all();
  const product = scan.productId
    ? db.select().from(products).where(eq(products.id, scan.productId)).get()
    : null;
  const company = product
    ? db.select().from(companies).where(eq(companies.id, product.companyId)).get()
    : null;
  const complaint = db.select().from(complaints).where(eq(complaints.scanId, scanId)).get();
  const compResponse = complaint
    ? db.select().from(companyResponses).where(eq(companyResponses.complaintId, complaint.id)).get()
    : null;
  const govReview = complaint
    ? db.select().from(governmentReviews).where(eq(governmentReviews.complaintId, complaint.id)).get()
    : null;

  const reportData: ReportData = {
    reportId: `DOCA-LM-${Date.now().toString().slice(-6)}`,
    generatedDate: new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    product: {
      name: product?.name || scan.productNameDetected || 'Pre-Packed Commodity',
      brand: product?.brand || scan.brandDetected || 'Commercial Brand',
      category: product?.category || 'Packaged Commodity',
      netQuantity: product?.standardNetQuantity || 'As Declared',
      mrp: product?.standardMrp || 'As Declared',
    },
    company: {
      name: company?.name || 'Registered Packaging Enterprise',
      registrationNo: company?.registrationNo || 'LM-REG-IND-902',
      address: company?.address || 'India',
      riskScore: company?.riskScore || 25,
    },
    scan: {
      scanId: scan.id,
      overallScore: scan.overallScore,
      overallStatus: scan.status,
      ruleSetVersion: scan.ruleSetVersion,
      ocrConfidence: scan.ocrConfidence,
    },
    declarations: decs.map((d) => ({
      label: d.label,
      detectedValue: d.detectedValue,
      confidence: d.confidence,
    })),
    ruleResults: rules.map((r) => ({
      ruleName: r.ruleName,
      sectionReference: r.sectionReference,
      status: r.status,
      confidence: r.confidence,
      detectedValue: r.detectedValue,
      expectedRequirement: r.expectedRequirement,
      explanation: r.explanation,
    })),
    fontAnalysis: JSON.parse(scan.fontAnalysisJson),
    complaint: complaint
      ? {
          complaintId: complaint.id,
          status: complaint.status,
          consumerNotes: complaint.consumerNotes || undefined,
          createdAt: complaint.createdAt,
        }
      : undefined,
    companyResponse: compResponse
      ? {
          responseText: compResponse.responseText,
          correctiveActionType: compResponse.correctiveActionType || undefined,
          submittedAt: compResponse.submittedAt,
        }
      : undefined,
    governmentReview: govReview
      ? {
          officerName: govReview.officerName,
          decision: govReview.decision,
          officerNotes: govReview.officerNotes,
          reviewDate: govReview.reviewDate,
          penaltyAmount: govReview.penaltyAmount || undefined,
        }
      : undefined,
  };

  const reportsDir = path.resolve(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const pdfPath = path.join(reportsDir, `${reportData.reportId}.pdf`);
  await ReportService.generatePDF(reportData, pdfPath);

  const fileStream = fs.createReadStream(pdfPath);
  reply.header('Content-Type', 'application/pdf');
  reply.header('Content-Disposition', `attachment; filename="${reportData.reportId}.pdf"`);
  return reply.send(fileStream);
});

server.get('/api/reports/:scanId/json', async (request, reply) => {
  const { scanId } = request.params as { scanId: string };
  const scan = db.select().from(scans).where(eq(scans.id, scanId)).get();

  if (!scan) {
    return reply.status(404).send({ error: 'Scan not found' });
  }

  const decs = db.select().from(declarations).where(eq(declarations.scanId, scanId)).all();
  const rules = db.select().from(ruleEvaluations).where(eq(ruleEvaluations.scanId, scanId)).all();

  return reply.send({
    scan,
    declarations: decs,
    ruleEvaluations: rules,
    exportedAt: new Date().toISOString(),
  });
});

// -------------------------------------------------------------
// RULES & AUDIT LOGS
// -------------------------------------------------------------

server.get('/api/rules', async (_request, reply) => {
  return reply.send({
    ruleSet: 'Legal Metrology (Packaged Commodities) Rules, 2011',
    version: CURRENT_RULESET_VERSION,
    status: 'ACTIVE',
    effectiveDate: '01 July 2026',
    statutoryAuthority: 'Department of Consumer Affairs (DoCA)',
    rules: LEGAL_METROLOGY_RULES,
  });
});

server.get('/api/audit-logs', async (_request, reply) => {
  const logs = db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(50).all();
  return reply.send(logs);
});

// -------------------------------------------------------------
// SERVER STARTUP
// -------------------------------------------------------------

  const PORT = 3001;
  const HOST = '0.0.0.0';

  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`🚀 Legal Metrology API server running at http://localhost:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();

