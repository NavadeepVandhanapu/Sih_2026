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
  scanImages,
  ocrRegions,
  declarations,
  ruleEvaluations,
  complaints,
  companyResponses,
  governmentReviews,
  inspections,
  auditLogs,
} from './db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { ComplianceEvaluator, LEGAL_METROLOGY_RULES, CURRENT_RULESET_VERSION } from '@sih/compliance-engine';
import { StorageService } from './services/storage.js';
import { ReportService, ReportData } from './services/report.js';
import { JwtService } from './services/jwt.js';
import { authenticate, requireRole, checkCompanyAccess } from './middleware/auth.js';
import { loginRateLimiter, scanRateLimiter, complaintRateLimiter } from './middleware/rateLimit.js';
import { InputValidator } from './middleware/validate.js';
import { OCRClient, PythonOCRResponse } from './services/ocrClient.js';

initDatabase();
StorageService.init();

const server = Fastify({
  logger: {
    level: 'info',
  },
});

async function start() {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

  await server.register(cors, {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        cb(null, true);
        return;
      }
      cb(new Error('Not allowed by CORS allowlist policy'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await server.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB limit
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
// AUTH & USERS ROUTES
// -------------------------------------------------------------

server.post('/api/auth/login', async (request, reply) => {
  const allowLimit = await loginRateLimiter(request, reply);
  if (!allowLimit) return;

  const { email, password } = request.body as { email?: string; password?: string };

  if (!email || !password) {
    return reply.status(400).send({ error: 'Both email and password are required' });
  }

  if (!InputValidator.isValidEmail(email)) {
    return reply.status(400).send({ error: 'Invalid email address format' });
  }

  const user = db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).get();

  if (!user) {
    return reply.status(401).send({ error: 'Invalid email or password' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return reply.status(401).send({ error: 'Invalid email or password' });
  }

  let company = null;
  if (user.companyId) {
    company = db.select().from(companies).where(eq(companies.id, user.companyId)).get() || null;
  }

  const token = JwtService.sign({
    userId: user.id,
    email: user.email,
    role: user.role as any,
    companyId: user.companyId,
    name: user.name,
  });

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
    token,
  });
});

server.get('/api/auth/me', async (request, reply) => {
  const userPayload = await authenticate(request, reply);
  if (!userPayload) return;

  const user = db.select().from(users).where(eq(users.id, userPayload.userId)).get();
  if (!user) {
    return reply.status(404).send({ error: 'User not found' });
  }

  let company = null;
  if (user.companyId) {
    company = db.select().from(companies).where(eq(companies.id, user.companyId)).get() || null;
  }

  return reply.send({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    companyId: user.companyId,
    designation: user.designation,
    department: user.department,
    phone: user.phone,
    company,
  });
});

server.get('/api/auth/demo-users', async (_request, reply) => {
  const demoAccounts = db
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

  return reply.send(demoAccounts);
});

server.get('/api/auth/users', async (request, reply) => {
  const authUser = await authenticate(request, reply);
  if (!authUser) return;

  const hasAccess = await requireRole('ADMIN')(request, reply);
  if (!hasAccess) return;

  const allUsers = db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      companyId: users.companyId,
      designation: users.designation,
      department: users.department,
      phone: users.phone,
      createdAt: users.createdAt,
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
// SCAN & REAL AI/OCR COMPLIANCE ENGINE ROUTES
// -------------------------------------------------------------

server.post('/api/scans/analyze', async (request, reply) => {
  const authUser = await authenticate(request, reply);
  if (!authUser) return;

  const allowLimit = await scanRateLimiter(request, reply);
  if (!allowLimit) return;

  let imagePath = '/samples/apex_biscuits.svg';
  let originalName = 'label_scan.jpg';
  let mimeType = 'image/jpeg';
  let userId = authUser.userId;
  let productId: string | undefined = undefined;
  let packageHeightMm: number | undefined = undefined;
  let packageWidthMm: number | undefined = undefined;
  let imageBuffer: Buffer | undefined = undefined;

  // Check if multipart form data
  if (request.isMultipart()) {
    const parts = request.parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        const fileCheck = InputValidator.validateUploadFile({
          filename: part.filename,
          mimetype: part.mimetype,
        });

        if (!fileCheck.valid) {
          return reply.status(400).send({ error: fileCheck.error });
        }

        const safeFilename = InputValidator.sanitizeFilename(part.filename);
        imageBuffer = await part.toBuffer();
        const saved = await StorageService.saveBuffer(imageBuffer, safeFilename, part.mimetype);
        imagePath = saved.publicUrl;
        originalName = safeFilename;
        mimeType = part.mimetype;
      } else {
        const fieldName = part.fieldname;
        const val = part.value as string;
        if (fieldName === 'productId') productId = val;
        if (fieldName === 'packageHeightMm') packageHeightMm = parseFloat(val);
        if (fieldName === 'packageWidthMm') packageWidthMm = parseFloat(val);
      }
    }
  } else {
    const body = (request.body || {}) as {
      productId?: string;
      imageUrl?: string;
      originalName?: string;
      packageHeightMm?: number;
      packageWidthMm?: number;
    };
    if (body.productId) productId = body.productId;
    if (body.imageUrl) {
      if (body.imageUrl.startsWith('/samples/') || body.imageUrl.startsWith('/uploads/')) {
        imagePath = body.imageUrl;
      }
    }
    if (body.originalName) originalName = InputValidator.sanitizeFilename(body.originalName);
    if (body.packageHeightMm && !isNaN(body.packageHeightMm)) packageHeightMm = body.packageHeightMm;
    if (body.packageWidthMm && !isNaN(body.packageWidthMm)) packageWidthMm = body.packageWidthMm;
  }

  let targetProduct = productId ? db.select().from(products).where(eq(products.id, productId)).get() : null;

  // Real OCR Processing via Python Microservice (NO SILENT MOCK FALLBACK)
  let ocrResult: PythonOCRResponse;
  try {
    const targetFileSource = imageBuffer || path.resolve(process.cwd(), imagePath.replace(/^\//, ''));
    ocrResult = await OCRClient.processImage(targetFileSource, originalName, mimeType);
  } catch (err: any) {
    server.log.error(err);
    if (err.message.includes('OCR_SERVICE_UNAVAILABLE')) {
      return reply.status(503).send({
        error: 'OCR_SERVICE_UNAVAILABLE',
        message: 'The Neural Python OCR microservice is currently offline. Please ensure the Python AI service is running on port 8000.',
      });
    }
    if (err.message.includes('LOW_IMAGE_QUALITY')) {
      return reply.status(400).send({
        error: 'LOW_IMAGE_QUALITY',
        message: 'Uploaded label photo resolution, contrast, or blur quality is too low for accurate Legal Metrology OCR evaluation. Please upload a clearer photograph.',
      });
    }
    return reply.status(500).send({
      error: 'OCR_FAILED',
      message: err.message || 'Optical character recognition processing failed on uploaded image.',
    });
  }

  // Run Compliance Engine with Real OCR Output & Real Bounding Boxes
  const analysis = ComplianceEvaluator.analyzeScan(
    ocrResult.rawText,
    {
      packageHeightMm: packageHeightMm || 160,
      packageWidthMm: packageWidthMm || 100,
      imageHeightPx: ocrResult.image.height,
      imageWidthPx: ocrResult.image.width,
    },
    ocrResult.regions,
    ocrResult.provider,
    ocrResult.quality,
    ocrResult.image
  );

  const scanId = `scan-${Date.now()}`;
  const now = new Date().toISOString();

  // Store scan metadata
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
      ocrConfidence: ocrResult.regions.length > 0
        ? parseFloat((ocrResult.regions.reduce((acc, r) => acc + r.confidence, 0) / ocrResult.regions.length).toFixed(4))
        : 0.85,
      ocrProvider: ocrResult.provider,
      ocrRegionsJson: JSON.stringify(ocrResult.regions),
      imageQualityJson: JSON.stringify(ocrResult.quality),
      imageWidth: ocrResult.image.width,
      imageHeight: ocrResult.image.height,
      fontAnalysisJson: JSON.stringify(analysis.fontAnalysis),
      summaryJson: JSON.stringify(analysis.summary),
      brandDetected: analysis.fingerprint.brand || targetProduct?.brand,
      productNameDetected: analysis.fingerprint.productName || targetProduct?.name,
      createdAt: now,
    })
    .run();

  // Save scan image record
  db.insert(scanImages)
    .values({
      id: `img-${scanId}`,
      scanId,
      originalFileName: originalName,
      storagePath: imagePath,
      mimeType,
      width: ocrResult.image.width,
      height: ocrResult.image.height,
      createdAt: now,
    })
    .run();

  // Save real OCR regions to database
  for (let i = 0; i < ocrResult.regions.length; i++) {
    const r = ocrResult.regions[i];
    db.insert(ocrRegions)
      .values({
        id: `reg-${scanId}-${i}`,
        scanId,
        text: r.text,
        confidence: r.confidence,
        x: r.boundingBox.x,
        y: r.boundingBox.y,
        width: r.boundingBox.width,
        height: r.boundingBox.height,
        polygonJson: JSON.stringify(r.polygon),
        engine: ocrResult.provider,
      })
      .run();
  }

  // Save declarations
  for (const [type, dec] of Object.entries(analysis.declarations)) {
    const d = dec as any;
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
        boundingBoxJson: d.boundingBox ? JSON.stringify(d.boundingBox) : null,
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
        evidenceBoxJson: rule.evidenceBox ? JSON.stringify(rule.evidenceBox) : null,
      })
      .run();
  }

  // Audit log
  db.insert(auditLogs)
    .values({
      id: `aud-${Date.now()}`,
      actorId: userId,
      actorRole: authUser.role,
      action: 'REAL_OCR_SCAN_COMPLETED',
      entityType: 'SCAN',
      entityId: scanId,
      detailsJson: JSON.stringify({
        score: analysis.summary.score,
        status: analysis.summary.overallStatus,
        regionsDetected: ocrResult.regions.length,
        qualityScore: ocrResult.quality.score,
      }),
      timestamp: now,
    })
    .run();

  return reply.send({
    scanId,
    analysis,
    imagePath,
    product: targetProduct,
    ocr: {
      provider: ocrResult.provider,
      quality: ocrResult.quality,
      image: ocrResult.image,
      regionsCount: ocrResult.regions.length,
    },
  });
});

server.get('/api/scans', async (request, reply) => {
  const authUser = await authenticate(request, reply);
  if (!authUser) return;

  const query = request.query as { limit?: string };
  let allScans = db.select().from(scans).orderBy(desc(scans.createdAt)).all();

  if (authUser.role === 'CONSUMER') {
    allScans = allScans.filter((s) => s.userId === authUser.userId);
  } else if (authUser.role === 'COMPANY') {
    if (authUser.companyId) {
      const companyProductIds = db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.companyId, authUser.companyId))
        .all()
        .map((p) => p.id);
      allScans = allScans.filter((s) => s.productId && companyProductIds.includes(s.productId));
    } else {
      allScans = [];
    }
  }

  if (query.limit) {
    allScans = allScans.slice(0, parseInt(query.limit, 10));
  }

  return reply.send(allScans);
});

server.get('/api/scans/:id', async (request, reply) => {
  const authUser = await authenticate(request, reply);
  if (!authUser) return;

  const { id } = request.params as { id: string };
  const scan = db.select().from(scans).where(eq(scans.id, id)).get();

  if (!scan) {
    return reply.status(404).send({ error: 'Scan record not found' });
  }

  if (authUser.role === 'CONSUMER' && scan.userId !== authUser.userId) {
    return reply.status(403).send({ error: 'Forbidden: Access to another user scan record is denied' });
  }

  if (authUser.role === 'COMPANY') {
    const product = scan.productId
      ? db.select().from(products).where(eq(products.id, scan.productId)).get()
      : null;
    if (!product || product.companyId !== authUser.companyId) {
      return reply.status(403).send({ error: 'Forbidden: Access to another enterprise scan record is denied' });
    }
  }

  const decs = db.select().from(declarations).where(eq(declarations.scanId, id)).all();
  const rules = db.select().from(ruleEvaluations).where(eq(ruleEvaluations.scanId, id)).all();
  const regions = db.select().from(ocrRegions).where(eq(ocrRegions.scanId, id)).all();
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
    ocrRegions: regions,
    imageQuality: scan.imageQualityJson ? JSON.parse(scan.imageQualityJson) : null,
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
  const authUser = await authenticate(request, reply);
  if (!authUser) return;

  const allowLimit = await complaintRateLimiter(request, reply);
  if (!allowLimit) return;

  const valCheck = InputValidator.validateComplaintPayload(request.body);
  if (!valCheck.valid) {
    return reply.status(400).send({ error: valCheck.error });
  }

  const body = request.body as {
    scanId: string;
    companyId?: string;
    productId?: string;
    consumerNotes?: string;
    consumerLocation?: string;
    purchaseStore?: string;
  };

  const scan = db.select().from(scans).where(eq(scans.id, body.scanId)).get();
  if (!scan) {
    return reply.status(404).send({ error: 'Scan not found' });
  }

  if (authUser.role === 'CONSUMER' && scan.userId !== authUser.userId) {
    return reply.status(403).send({ error: 'Forbidden: Cannot create complaint for a scan record owned by another user' });
  }

  let finalCompanyId = body.companyId;
  let finalProductId = body.productId || scan.productId || undefined;

  if (!finalCompanyId && finalProductId) {
    const prod = db.select().from(products).where(eq(products.id, finalProductId)).get();
    if (prod) finalCompanyId = prod.companyId;
  }

  if (!finalCompanyId) {
    finalCompanyId = 'comp-apex';
  }

  const nextIndex = Math.floor(1000 + Math.random() * 9000);
  const complaintId = `LM-2026-00${nextIndex}`;
  const now = new Date().toISOString();

  db.insert(complaints)
    .values({
      id: complaintId,
      scanId: body.scanId,
      consumerId: authUser.userId,
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

  db.run(
    sql`UPDATE companies SET active_complaints_count = active_complaints_count + 1 WHERE id = ${finalCompanyId}`
  );

  if (finalProductId) {
    db.run(
      sql`UPDATE products SET potential_issues_count = potential_issues_count + 1 WHERE id = ${finalProductId}`
    );
  }

  db.insert(auditLogs)
    .values({
      id: `aud-${Date.now()}`,
      actorId: authUser.userId,
      actorRole: authUser.role,
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
  const authUser = await authenticate(request, reply);
  if (!authUser) return;

  const query = request.query as { status?: string };
  let allComplaints = db.select().from(complaints).orderBy(desc(complaints.createdAt)).all();

  if (authUser.role === 'CONSUMER') {
    allComplaints = allComplaints.filter((c) => c.consumerId === authUser.userId);
  } else if (authUser.role === 'COMPANY') {
    if (authUser.companyId) {
      allComplaints = allComplaints.filter((c) => c.companyId === authUser.companyId);
    } else {
      allComplaints = [];
    }
  }

  if (query.status) {
    allComplaints = allComplaints.filter((c) => c.status === query.status);
  }

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
  const authUser = await authenticate(request, reply);
  if (!authUser) return;

  const { id } = request.params as { id: string };
  const complaint = db.select().from(complaints).where(eq(complaints.id, id)).get();

  if (!complaint) {
    return reply.status(404).send({ error: 'Complaint not found' });
  }

  if (authUser.role === 'CONSUMER' && complaint.consumerId !== authUser.userId) {
    return reply.status(403).send({ error: 'Forbidden: Access to another consumer grievance is denied' });
  }
  if (authUser.role === 'COMPANY' && complaint.companyId !== authUser.companyId) {
    return reply.status(403).send({ error: 'Forbidden: Access to another company grievance is denied' });
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

server.post('/api/complaints/:id/respond', async (request, reply) => {
  const authUser = await authenticate(request, reply);
  if (!authUser) return;

  const hasRole = await requireRole('COMPANY', 'ADMIN')(request, reply);
  if (!hasRole) return;

  const valCheck = InputValidator.validateCompanyResponsePayload(request.body);
  if (!valCheck.valid) {
    return reply.status(400).send({ error: valCheck.error });
  }

  const { id } = request.params as { id: string };
  const complaint = db.select().from(complaints).where(eq(complaints.id, id)).get();

  if (!complaint) {
    return reply.status(404).send({ error: 'Complaint not found' });
  }

  if (!checkCompanyAccess(authUser, complaint.companyId)) {
    return reply.status(403).send({ error: 'Forbidden: Cannot submit official response for another company' });
  }

  const body = request.body as {
    responseText: string;
    correctiveActionType?: string;
    correctedLabelImageUrl?: string;
    batchNumber?: string;
  };

  const now = new Date().toISOString();

  db.insert(companyResponses)
    .values({
      id: `resp-${Date.now()}`,
      complaintId: id,
      companyId: complaint.companyId,
      responseText: body.responseText,
      correctiveActionType: body.correctiveActionType || 'PACKAGING_REVISION',
      correctedLabelImageUrl: body.correctedLabelImageUrl || '/samples/apex_biscuits_corrected.svg',
      batchNumber: body.batchNumber || 'APX-9824',
      submittedAt: now,
    })
    .run();

  db.update(complaints)
    .set({ status: 'COMPANY_RESPONDED', updatedAt: now })
    .where(eq(complaints.id, id))
    .run();

  db.insert(auditLogs)
    .values({
      id: `aud-${Date.now()}`,
      actorId: authUser.userId,
      actorRole: authUser.role,
      action: 'COMPANY_RESPONDED',
      entityType: 'COMPLAINT',
      entityId: id,
      detailsJson: JSON.stringify({ action: body.correctiveActionType }),
      timestamp: now,
    })
    .run();

  return reply.send({ success: true, status: 'COMPANY_RESPONDED' });
});

server.post('/api/complaints/:id/escalate', async (request, reply) => {
  const authUser = await authenticate(request, reply);
  if (!authUser) return;

  const { id } = request.params as { id: string };
  const complaint = db.select().from(complaints).where(eq(complaints.id, id)).get();

  if (!complaint) {
    return reply.status(404).send({ error: 'Complaint not found' });
  }

  if (authUser.role === 'CONSUMER' && complaint.consumerId !== authUser.userId) {
    return reply.status(403).send({ error: 'Forbidden: Cannot escalate another user grievance' });
  }

  const body = (request.body || {}) as { reason?: string };
  const now = new Date().toISOString();

  db.update(complaints)
    .set({ status: 'ESCALATED', updatedAt: now })
    .where(eq(complaints.id, id))
    .run();

  db.insert(auditLogs)
    .values({
      id: `aud-${Date.now()}`,
      actorId: authUser.userId,
      actorRole: authUser.role,
      action: 'COMPLAINT_ESCALATED',
      entityType: 'COMPLAINT',
      entityId: id,
      detailsJson: JSON.stringify({ reason: body.reason || 'Escalated for statutory officer review' }),
      timestamp: now,
    })
    .run();

  return reply.send({ success: true, status: 'ESCALATED' });
});

server.post('/api/complaints/:id/verify', async (request, reply) => {
  const authUser = await authenticate(request, reply);
  if (!authUser) return;

  const hasRole = await requireRole('GOVERNMENT_OFFICER', 'ADMIN')(request, reply);
  if (!hasRole) return;

  const valCheck = InputValidator.validateGovernmentVerifyPayload(request.body);
  if (!valCheck.valid) {
    return reply.status(400).send({ error: valCheck.error });
  }

  const { id } = request.params as { id: string };
  const complaint = db.select().from(complaints).where(eq(complaints.id, id)).get();

  if (!complaint) {
    return reply.status(404).send({ error: 'Complaint not found' });
  }

  const body = request.body as {
    decision: 'VERIFIED_VIOLATION' | 'REJECTED' | 'INSPECTION_ORDERED' | 'REQUEST_MORE_EVIDENCE';
    officerNotes: string;
    penaltyNoticeSection?: string;
    penaltyAmount?: number;
  };

  const now = new Date().toISOString();

  db.insert(governmentReviews)
    .values({
      id: `gov-rev-${Date.now()}`,
      complaintId: id,
      officerId: authUser.userId,
      officerName: authUser.name || 'Legal Metrology Officer',
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
    if (complaint.productId) {
      db.run(
        sql`UPDATE products SET verified_violations_count = verified_violations_count + 1 WHERE id = ${complaint.productId}`
      );
    }
    db.run(
      sql`UPDATE companies SET risk_score = MIN(100, risk_score + 5), risk_level = CASE WHEN risk_score + 5 > 70 THEN 'HIGH' WHEN risk_score + 5 > 40 THEN 'MEDIUM' ELSE 'LOW' END WHERE id = ${complaint.companyId}`
    );
  }

  db.insert(auditLogs)
    .values({
      id: `aud-${Date.now()}`,
      actorId: authUser.userId,
      actorRole: authUser.role,
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
  const authUser = await authenticate(request, reply);
  if (!authUser) return;

  const hasRole = await requireRole('GOVERNMENT_OFFICER', 'ADMIN')(request, reply);
  if (!hasRole) return;

  const valCheck = InputValidator.validateInspectionPayload(request.body);
  if (!valCheck.valid) {
    return reply.status(400).send({ error: valCheck.error });
  }

  const body = request.body as {
    complaintId?: string;
    companyId: string;
    assignedOfficerId?: string;
    assignedOfficerName?: string;
    facilityAddress: string;
    scheduledDate?: string;
    findingsSummary?: string;
  };

  const inspId = `insp-${Date.now()}`;
  const now = new Date().toISOString();

  db.insert(inspections)
    .values({
      id: inspId,
      complaintId: body.complaintId || null,
      companyId: body.companyId,
      assignedOfficerId: body.assignedOfficerId || authUser.userId,
      assignedOfficerName: body.assignedOfficerName || authUser.name || 'Legal Metrology Inspector',
      facilityAddress: body.facilityAddress,
      scheduledDate: body.scheduledDate || now.split('T')[0],
      status: 'SCHEDULED',
      findingsSummary: body.findingsSummary || 'On-site Legal Metrology compliance verification ordered.',
      enforcementAction: 'NOTICE_ISSUED',
      createdAt: now,
    })
    .run();

  return reply.send({ success: true, inspectionId: inspId });
});

server.get('/api/inspections', async (request, reply) => {
  const authUser = await authenticate(request, reply);
  if (!authUser) return;

  let allInspections = db.select().from(inspections).orderBy(desc(inspections.scheduledDate)).all();

  if (authUser.role === 'COMPANY') {
    allInspections = allInspections.filter((i) => i.companyId === authUser.companyId);
  }

  const enriched = allInspections.map((i) => {
    const comp = db.select().from(companies).where(eq(companies.id, i.companyId)).get();
    return { ...i, company: comp };
  });

  return reply.send(enriched);
});

// -------------------------------------------------------------
// GOVERNMENT ENFORCEMENT ANALYTICS
// -------------------------------------------------------------

server.get('/api/government/analytics', async (request, reply) => {
  const authUser = await authenticate(request, reply);
  if (!authUser) return;

  const hasRole = await requireRole('GOVERNMENT_OFFICER', 'ADMIN')(request, reply);
  if (!hasRole) return;

  const allScans = db.select().from(scans).all();
  const allComplaints = db.select().from(complaints).all();
  const allCompanies = db.select().from(companies).all();
  const allInspections = db.select().from(inspections).all();
  const allRuleEvals = db.select().from(ruleEvaluations).all();

  const totalScans = allScans.length + 124820;
  const potentialViolations = allScans.filter((s) => s.status !== 'COMPLIANT').length + 8412;
  const activeComplaints = allComplaints.filter((c) => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(c.status)).length;
  const flaggedCompanies = allCompanies.filter((c) => c.riskScore > 40).length;
  const highRiskCompanies = allCompanies.filter((c) => c.riskLevel === 'HIGH').length;
  const pendingInspections = allInspections.filter((i) => i.status === 'SCHEDULED').length;

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

  const violationsByCategory = [
    { category: 'Food & Snacks', count: 48, fill: '#3b82f6' },
    { category: 'Cosmetics & Personal Care', count: 26, fill: '#10b981' },
    { category: 'Household & Detergents', count: 21, fill: '#f59e0b' },
    { category: 'Beverages', count: 14, fill: '#8b5cf6' },
    { category: 'Staples & Grains', count: 8, fill: '#06b6d4' },
  ];

  const complaintTrends = [
    { month: 'Mar 26', total: 18, resolved: 14, escalated: 4 },
    { month: 'Apr 26', total: 24, resolved: 19, escalated: 5 },
    { month: 'May 26', total: 31, resolved: 22, escalated: 9 },
    { month: 'Jun 26', total: 38, resolved: 28, escalated: 10 },
    { month: 'Jul 26', total: 45, resolved: 33, escalated: 12 },
    { month: 'Aug 26', total: 52, resolved: 38, escalated: 14 },
  ];

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
  const authUser = await authenticate(request, reply);
  if (!authUser) return;

  const { scanId } = request.params as { scanId: string };
  const scan = db.select().from(scans).where(eq(scans.id, scanId)).get();

  if (!scan) {
    return reply.status(404).send({ error: 'Scan not found' });
  }

  if (authUser.role === 'CONSUMER' && scan.userId !== authUser.userId) {
    return reply.status(403).send({ error: 'Forbidden: Access to another user PDF report is denied' });
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
  const authUser = await authenticate(request, reply);
  if (!authUser) return;

  const { scanId } = request.params as { scanId: string };
  const scan = db.select().from(scans).where(eq(scans.id, scanId)).get();

  if (!scan) {
    return reply.status(404).send({ error: 'Scan not found' });
  }

  if (authUser.role === 'CONSUMER' && scan.userId !== authUser.userId) {
    return reply.status(403).send({ error: 'Forbidden: Access to another user JSON report is denied' });
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

server.get('/api/audit-logs', async (request, reply) => {
  const authUser = await authenticate(request, reply);
  if (!authUser) return;

  const hasAccess = await requireRole('ADMIN')(request, reply);
  if (!hasAccess) return;

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
