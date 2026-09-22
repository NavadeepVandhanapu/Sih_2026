import bcrypt from 'bcryptjs';
import { db, initDatabase } from './index.js';
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
} from './schema.js';

export async function seed() {
  console.log('🌱 Starting Legal Metrology compliance database seeding...');
  initDatabase();

  const passwordHash = await bcrypt.hash('demo123', 8);

  // 1. Seed Companies (10 Fictional Companies)
  const companyData = [
    {
      id: 'comp-apex',
      name: 'Apex Foods Pvt Ltd',
      registrationNo: 'LM/DL/2021/88902',
      category: 'Food & Snacks',
      riskScore: 78,
      riskLevel: 'HIGH',
      address: 'Plot 42, Industrial Area, Sector 5, Haridwar, Uttarakhand - 249403',
      state: 'Uttarakhand',
      complianceRate: 71,
      activeComplaintsCount: 8,
      totalProductsCount: 6,
      createdAt: '2024-01-15T09:00:00Z',
    },
    {
      id: 'comp-greenbasket',
      name: 'GreenBasket Organics',
      registrationNo: 'LM/MH/2020/45129',
      category: 'Edible Oils & Ghee',
      riskScore: 22,
      riskLevel: 'LOW',
      address: '702, Trade Link Tower, Lower Parel, Mumbai, Maharashtra - 400013',
      state: 'Maharashtra',
      complianceRate: 96,
      activeComplaintsCount: 1,
      totalProductsCount: 5,
      createdAt: '2024-02-10T10:30:00Z',
    },
    {
      id: 'comp-nova',
      name: 'Nova Agro Foods',
      registrationNo: 'LM/KA/2022/19082',
      category: 'Dairy & Milk Products',
      riskScore: 64,
      riskLevel: 'MEDIUM',
      address: 'Building 14, Electronic City Phase 1, Bengaluru, Karnataka - 560100',
      state: 'Karnataka',
      complianceRate: 79,
      activeComplaintsCount: 5,
      totalProductsCount: 4,
      createdAt: '2024-03-01T11:00:00Z',
    },
    {
      id: 'comp-pureharvest',
      name: 'PureHarvest Foods',
      registrationNo: 'LM/PB/2019/33211',
      category: 'Staples, Grains & Pulses',
      riskScore: 35,
      riskLevel: 'LOW',
      address: 'GT Road Bypass, Khanna, Ludhiana, Punjab - 141401',
      state: 'Punjab',
      complianceRate: 92,
      activeComplaintsCount: 2,
      totalProductsCount: 5,
      createdAt: '2024-01-20T14:15:00Z',
    },
    {
      id: 'comp-urban',
      name: 'Urban Essentials Pvt Ltd',
      registrationNo: 'LM/DL/2023/77123',
      category: 'Snacks & Confectionery',
      riskScore: 82,
      riskLevel: 'HIGH',
      address: 'B-34, Okhla Phase II, New Delhi - 110020',
      state: 'Delhi',
      complianceRate: 68,
      activeComplaintsCount: 11,
      totalProductsCount: 4,
      createdAt: '2024-04-12T08:45:00Z',
    },
    {
      id: 'comp-zenith',
      name: 'Zenith Confectionery',
      registrationNo: 'LM/GJ/2021/60914',
      category: 'Snacks & Confectionery',
      riskScore: 48,
      riskLevel: 'MEDIUM',
      address: 'Survey 112, GIDC Sanand, Ahmedabad, Gujarat - 382110',
      state: 'Gujarat',
      complianceRate: 85,
      activeComplaintsCount: 3,
      totalProductsCount: 3,
      createdAt: '2024-02-18T16:20:00Z',
    },
    {
      id: 'comp-himalayan',
      name: 'Himalayan Herbal Naturals',
      registrationNo: 'LM/HP/2022/90218',
      category: 'Edible Oils & Ghee',
      riskScore: 28,
      riskLevel: 'LOW',
      address: 'Solan Industrial Estate, Solan, Himachal Pradesh - 173212',
      state: 'Himachal Pradesh',
      complianceRate: 94,
      activeComplaintsCount: 1,
      totalProductsCount: 3,
      createdAt: '2024-03-22T13:10:00Z',
    },
    {
      id: 'comp-stellar',
      name: 'Stellar Beverages Ltd',
      registrationNo: 'LM/TN/2020/54129',
      category: 'Beverages & Juices',
      riskScore: 56,
      riskLevel: 'MEDIUM',
      address: 'SIPCOT Industrial Park, Sriperumbudur, Tamil Nadu - 602105',
      state: 'Tamil Nadu',
      complianceRate: 82,
      activeComplaintsCount: 4,
      totalProductsCount: 3,
      createdAt: '2024-01-29T11:40:00Z',
    },
    {
      id: 'comp-pratham',
      name: 'Pratham Dairy Products',
      registrationNo: 'LM/RJ/2021/41209',
      category: 'Dairy',
      riskScore: 30,
      riskLevel: 'LOW',
      address: 'RIICO Industrial Area, Alwar, Rajasthan - 301001',
      state: 'Rajasthan',
      complianceRate: 93,
      activeComplaintsCount: 2,
      totalProductsCount: 3,
      createdAt: '2024-02-25T15:00:00Z',
    },
    {
      id: 'comp-radiant',
      name: 'Radiant Personal Care',
      registrationNo: 'LM/UP/2023/88102',
      category: 'Personal Care',
      riskScore: 68,
      riskLevel: 'MEDIUM',
      address: 'Site IV, Sahibabad Industrial Area, Ghaziabad, Uttar Pradesh - 201010',
      state: 'Uttar Pradesh',
      complianceRate: 77,
      activeComplaintsCount: 6,
      totalProductsCount: 2,
      createdAt: '2024-03-30T10:00:00Z',
    },
  ];

  for (const c of companyData) {
    db.insert(companies).values(c).onConflictDoNothing().run();
  }

  // 2. Seed Demo Accounts
  const userData = [
    {
      id: 'usr-consumer',
      email: 'consumer@demo.com',
      passwordHash,
      name: 'Aarav Sharma (Consumer)',
      role: 'CONSUMER',
      phone: '+91 98765 43210',
      designation: 'Citizen Consumer',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'usr-company',
      email: 'company@demo.com',
      passwordHash,
      name: 'Rajesh Verma (Quality Head)',
      role: 'COMPANY',
      companyId: 'comp-apex',
      phone: '+91 98112 23344',
      designation: 'VP Regulatory Compliance',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'usr-officer',
      email: 'officer@demo.com',
      passwordHash,
      name: 'Sunita Meena, IO-LM',
      role: 'GOVERNMENT_OFFICER',
      phone: '+91 94140 11223',
      designation: 'Legal Metrology Officer (Inspector)',
      department: 'Department of Consumer Affairs, New Delhi Central Zone',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'usr-admin',
      email: 'admin@demo.com',
      passwordHash,
      name: 'Dr. K. R. Nambiar (Controller)',
      role: 'ADMIN',
      phone: '+91 99000 88776',
      designation: 'Joint Secretary & Legal Metrology Director',
      department: 'Ministry of Consumer Affairs, Food & Public Distribution',
      createdAt: '2024-01-01T00:00:00Z',
    },
  ];

  for (const u of userData) {
    db.insert(users).values(u).onConflictDoNothing().run();
  }

  // 3. Seed Products (30 Products)
  const productData = [
    {
      id: 'prod-apex-biscuits',
      companyId: 'comp-apex',
      name: 'Cream Biscuits Vanilla',
      brand: 'Apex Delight',
      category: 'Food & Snacks',
      barcode: '8901030012345',
      standardNetQuantity: '200 g',
      standardMrp: '₹40.00',
      totalScans: 42,
      potentialIssuesCount: 18,
      verifiedViolationsCount: 3,
      complianceStatus: 'POTENTIAL_NON_COMPLIANCE',
      sampleImageUrl: '/samples/apex_biscuits.svg',
      createdAt: '2024-01-18T00:00:00Z',
    },
    {
      id: 'prod-apex-chips',
      companyId: 'comp-apex',
      name: 'Tangy Tomato Potato Crisps',
      brand: 'Apex Munch',
      category: 'Snacks & Confectionery',
      barcode: '8901030012346',
      standardNetQuantity: '90 g',
      standardMrp: '₹20.00',
      totalScans: 28,
      potentialIssuesCount: 4,
      verifiedViolationsCount: 1,
      complianceStatus: 'POTENTIAL_NON_COMPLIANCE',
      sampleImageUrl: '/samples/apex_chips.svg',
      createdAt: '2024-01-22T00:00:00Z',
    },
    {
      id: 'prod-greenbasket-oil',
      companyId: 'comp-greenbasket',
      name: 'Pure Cold Pressed Mustard Oil',
      brand: 'GreenBasket Organics',
      category: 'Edible Oils & Ghee',
      barcode: '8902040056781',
      standardNetQuantity: '1 L',
      standardMrp: '₹195.00',
      totalScans: 35,
      potentialIssuesCount: 1,
      verifiedViolationsCount: 0,
      complianceStatus: 'COMPLIANT',
      sampleImageUrl: '/samples/greenbasket_oil.svg',
      createdAt: '2024-02-12T00:00:00Z',
    },
    {
      id: 'prod-nova-dishwash',
      companyId: 'comp-nova',
      name: 'Farm Fresh Full Cream Milk Tetrapack',
      brand: 'Nova Dairy',
      category: 'Dairy & Milk Products',
      barcode: '8903050078901',
      standardNetQuantity: '500 ml',
      standardMrp: '₹38.00',
      totalScans: 31,
      potentialIssuesCount: 12,
      verifiedViolationsCount: 2,
      complianceStatus: 'POTENTIAL_NON_COMPLIANCE',
      sampleImageUrl: '/samples/nova_dishwash.svg',
      createdAt: '2024-03-05T00:00:00Z',
    },
    {
      id: 'prod-pureharvest-atta',
      companyId: 'comp-pureharvest',
      name: '100% Sharbati Whole Wheat Atta',
      brand: 'PureHarvest Golden',
      category: 'Staples, Grains & Pulses',
      barcode: '8904060098765',
      standardNetQuantity: '5 kg',
      standardMrp: '₹295.00',
      totalScans: 48,
      potentialIssuesCount: 3,
      verifiedViolationsCount: 0,
      complianceStatus: 'COMPLIANT',
      sampleImageUrl: '/samples/pureharvest_atta.svg',
      createdAt: '2024-01-25T00:00:00Z',
    },
    {
      id: 'prod-urban-wafers',
      companyId: 'comp-urban',
      name: 'Cheese Flavoured Crunchy Wafers',
      brand: 'Urban Nibbles',
      category: 'Snacks & Confectionery',
      barcode: '8905070011223',
      standardNetQuantity: '150 g',
      standardMrp: '₹60.00',
      totalScans: 39,
      potentialIssuesCount: 21,
      verifiedViolationsCount: 4,
      complianceStatus: 'POTENTIAL_NON_COMPLIANCE',
      sampleImageUrl: '/samples/urban_wafers.svg',
      createdAt: '2024-04-15T00:00:00Z',
    },
    {
      id: 'prod-zenith-chocolate',
      companyId: 'comp-zenith',
      name: 'Dark Cocoa Silk Bar',
      brand: 'Zenith Royale',
      category: 'Food & Confectionery',
      barcode: '8906080033445',
      standardNetQuantity: '80 g',
      standardMrp: '₹99.00',
      totalScans: 22,
      potentialIssuesCount: 4,
      verifiedViolationsCount: 1,
      complianceStatus: 'COMPLIANT',
      sampleImageUrl: '/samples/zenith_chocolate.svg',
      createdAt: '2024-02-20T00:00:00Z',
    },
    {
      id: 'prod-stellar-juice',
      companyId: 'comp-stellar',
      name: '100% Pulpy Orange Nectar',
      brand: 'Stellar Splash',
      category: 'Beverages',
      barcode: '8907090055667',
      standardNetQuantity: '1 L',
      standardMrp: '₹140.00',
      totalScans: 25,
      potentialIssuesCount: 6,
      verifiedViolationsCount: 1,
      complianceStatus: 'POTENTIAL_NON_COMPLIANCE',
      sampleImageUrl: '/samples/stellar_juice.svg',
      createdAt: '2024-02-02T00:00:00Z',
    },
  ];

  for (const p of productData) {
    db.insert(products).values(p).onConflictDoNothing().run();
  }

  // 4. Seed Scans and Evaluations (Rich Demonstration Scans)
  const demoScans = [
    {
      id: 'scan-apex-demo-01',
      userId: 'usr-consumer',
      productId: 'prod-apex-biscuits',
      imagePath: '/samples/apex_biscuits.svg',
      originalFileName: 'apex_biscuits_pack.jpg',
      status: 'POTENTIAL_NON_COMPLIANCE',
      overallScore: 62,
      ruleSetVersion: '2026.1',
      ocrText: `
Apex Delight Cream Biscuits Vanilla
Manufactured by: Apex Foods Pvt. Ltd., Plot 42, Industrial Area, Sector 5, Haridwar, Uttarakhand - 249403
Net Quantity: 200 g
MRP: Rs. 40.00
Date of Packing: 07/2026
Batch No: APX-9824
Unit Sale Price: Rs. 0.20 per g
Made in India
`.trim(),
      ocrConfidence: 0.94,
      fontAnalysisJson: JSON.stringify({
        estimatedCharHeightMm: 1.7,
        requiredMinimumMm: 2.0,
        calibrationMethod: 'user_dimensions',
        status: 'POTENTIAL_NON_COMPLIANCE',
        confidence: 0.76,
        explanation: 'Estimated character height (1.7 mm) is below statutory minimum 2.0 mm for 200g commodity panel.',
      }),
      summaryJson: JSON.stringify({
        overallStatus: 'POTENTIAL_NON_COMPLIANCE',
        score: 62,
        totalRulesEvaluated: 7,
        compliantCount: 4,
        flaggedCount: 2,
        reviewCount: 1,
        ruleSetVersion: '2026.1',
      }),
      brandDetected: 'Apex Delight',
      productNameDetected: 'Cream Biscuits Vanilla',
      createdAt: '2026-08-14T11:20:00Z',
    },
    {
      id: 'scan-greenbasket-demo-02',
      userId: 'usr-consumer',
      productId: 'prod-greenbasket-oil',
      imagePath: '/samples/greenbasket_oil.svg',
      originalFileName: 'greenbasket_almond_oil.jpg',
      status: 'COMPLIANT',
      overallScore: 98,
      ruleSetVersion: '2026.1',
      ocrText: `
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
`.trim(),
      ocrConfidence: 0.98,
      fontAnalysisJson: JSON.stringify({
        estimatedCharHeightMm: 2.4,
        requiredMinimumMm: 2.0,
        calibrationMethod: 'user_dimensions',
        status: 'COMPLIANT',
        confidence: 0.92,
        explanation: 'Character height complies with Rule 7 & 8 minimum height tables.',
      }),
      summaryJson: JSON.stringify({
        overallStatus: 'COMPLIANT',
        score: 98,
        totalRulesEvaluated: 7,
        compliantCount: 7,
        flaggedCount: 0,
        reviewCount: 0,
        ruleSetVersion: '2026.1',
      }),
      brandDetected: 'GreenBasket Botanicals',
      productNameDetected: 'Pure Cold Pressed Sweet Almond Oil',
      createdAt: '2026-08-20T15:45:00Z',
    },
    {
      id: 'scan-nova-demo-03',
      userId: 'usr-consumer',
      productId: 'prod-nova-dishwash',
      imagePath: '/samples/nova_dishwash.svg',
      originalFileName: 'nova_dishwash_500ml.jpg',
      status: 'POTENTIAL_NON_COMPLIANCE',
      overallScore: 68,
      ruleSetVersion: '2026.1',
      ocrText: `
Nova Clean Lemon Power Liquid Dishwash
Manufactured by: Nova Household Goods, Building 14, Electronic City, Bengaluru, KA - 560100
Net Quantity: 500 ml
MRP: ₹115.00 (incl. of all taxes)
Date of Packing: 05/2026
Batch: NV-9901
Consumer Care: Phone: 080-23456789
`.trim(),
      ocrConfidence: 0.93,
      fontAnalysisJson: JSON.stringify({
        estimatedCharHeightMm: 1.5,
        requiredMinimumMm: 4.0,
        calibrationMethod: 'user_dimensions',
        status: 'POTENTIAL_NON_COMPLIANCE',
        confidence: 0.81,
        explanation: 'Font size (1.5mm) is severely undersized for 500ml package (prescribed 4.0mm).',
      }),
      summaryJson: JSON.stringify({
        overallStatus: 'POTENTIAL_NON_COMPLIANCE',
        score: 68,
        totalRulesEvaluated: 7,
        compliantCount: 4,
        flaggedCount: 2,
        reviewCount: 1,
        ruleSetVersion: '2026.1',
      }),
      brandDetected: 'Nova Clean',
      productNameDetected: 'Lemon Power Liquid Dishwash',
      createdAt: '2026-08-25T09:10:00Z',
    },
  ];

  for (const s of demoScans) {
    db.insert(scans).values(s).onConflictDoNothing().run();
  }

  // 5. Seed Declarations for Apex Biscuit demo scan
  const apexDeclarations = [
    {
      id: 'dec-apex-1',
      scanId: 'scan-apex-demo-01',
      declarationType: 'manufacturer',
      label: 'Manufacturer Name & Address',
      detectedValue: 'Apex Foods Pvt. Ltd., Plot 42, Industrial Area, Sector 5, Haridwar, Uttarakhand - 249403',
      confidence: 0.95,
      rawSnippet: 'Manufactured by: Apex Foods Pvt. Ltd., Plot 42, Industrial Area, Sector 5, Haridwar, Uttarakhand - 249403',
      notes: 'Complete manufacturing unit address detected',
    },
    {
      id: 'dec-apex-2',
      scanId: 'scan-apex-demo-01',
      declarationType: 'net_quantity',
      label: 'Net Quantity',
      detectedValue: '200 g',
      confidence: 0.98,
      rawSnippet: 'Net Quantity: 200 g',
      notes: 'Standard metric unit verified',
    },
    {
      id: 'dec-apex-3',
      scanId: 'scan-apex-demo-01',
      declarationType: 'mrp',
      label: 'Maximum Retail Price (MRP)',
      detectedValue: '₹40.00',
      confidence: 0.84,
      rawSnippet: 'MRP: Rs. 40.00',
      notes: 'Price detected but lacks explicit "inclusive of all taxes"',
    },
    {
      id: 'dec-apex-4',
      scanId: 'scan-apex-demo-01',
      declarationType: 'mfg_date',
      label: 'Month & Year of Manufacture/Packing',
      detectedValue: '07/2026',
      confidence: 0.95,
      rawSnippet: 'Date of Packing: 07/2026',
      notes: 'Valid packing date format',
    },
    {
      id: 'dec-apex-5',
      scanId: 'scan-apex-demo-01',
      declarationType: 'consumer_care',
      label: 'Consumer Care Details',
      detectedValue: null,
      confidence: 0.12,
      notes: 'No customer care email, toll-free number or grievance redressal desk identified',
    },
    {
      id: 'dec-apex-6',
      scanId: 'scan-apex-demo-01',
      declarationType: 'unit_sale_price',
      label: 'Unit Sale Price (USP)',
      detectedValue: '₹0.20 / g',
      confidence: 0.92,
      rawSnippet: 'Unit Sale Price: Rs. 0.20 per g',
      notes: 'USP properly computed and declared',
    },
  ];

  for (const d of apexDeclarations) {
    db.insert(declarations).values(d).onConflictDoNothing().run();
  }

  // 6. Seed Rule Evaluations for Apex Biscuit demo scan
  const apexRuleEvals = [
    {
      id: 'rev-apex-1',
      scanId: 'scan-apex-demo-01',
      ruleId: 'LM-RULE-001',
      ruleName: 'Manufacturer Identification & Address',
      sectionReference: 'Rule 6(1)(a)',
      severity: 'HIGH',
      status: 'COMPLIANT',
      confidence: 0.95,
      detectedValue: 'Apex Foods Pvt. Ltd., Plot 42, Industrial Area, Sector 5, Haridwar',
      expectedRequirement: 'Complete name & premise address of manufacturer/packer',
      explanation: 'Manufacturer identity statement located with legal premise details.',
      evidenceSnippet: 'Manufactured by: Apex Foods Pvt. Ltd.',
    },
    {
      id: 'rev-apex-2',
      scanId: 'scan-apex-demo-01',
      ruleId: 'LM-RULE-002',
      ruleName: 'Standard Net Quantity Statement',
      sectionReference: 'Rule 6(1)(c)',
      severity: 'HIGH',
      status: 'COMPLIANT',
      confidence: 0.98,
      detectedValue: '200 g',
      expectedRequirement: 'Standard metric unit (g, kg, ml, l, or count)',
      explanation: 'Standard metric declaration verified: "200 g".',
      evidenceSnippet: 'Net Quantity: 200 g',
    },
    {
      id: 'rev-apex-3',
      scanId: 'scan-apex-demo-01',
      ruleId: 'LM-RULE-003',
      ruleName: 'Maximum Retail Price (MRP) Declaration',
      sectionReference: 'Rule 6(1)(e)',
      severity: 'HIGH',
      status: 'MANUAL_REVIEW_RECOMMENDED',
      confidence: 0.84,
      detectedValue: '₹40.00',
      expectedRequirement: 'MRP Rs... inclusive of all taxes',
      explanation: 'Retail price declared, but explicit "inclusive of all taxes" clause requires officer verification.',
      evidenceSnippet: 'MRP: Rs. 40.00',
    },
    {
      id: 'rev-apex-4',
      scanId: 'scan-apex-demo-01',
      ruleId: 'LM-RULE-004',
      ruleName: 'Month and Year of Manufacture / Packing',
      sectionReference: 'Rule 6(1)(d)',
      severity: 'HIGH',
      status: 'COMPLIANT',
      confidence: 0.95,
      detectedValue: '07/2026',
      expectedRequirement: 'Month & year of manufacture or packing in MM/YYYY',
      explanation: 'Manufacturing / packing date identified: 07/2026.',
      evidenceSnippet: 'Date of Packing: 07/2026',
    },
    {
      id: 'rev-apex-5',
      scanId: 'scan-apex-demo-01',
      ruleId: 'LM-RULE-005',
      ruleName: 'Consumer Care Contact Details',
      sectionReference: 'Rule 6(1)(n) & Rule 6(2)',
      severity: 'HIGH',
      status: 'POTENTIAL_NON_COMPLIANCE',
      confidence: 0.93,
      detectedValue: null,
      expectedRequirement: 'Telephone number, email address, and postal address for grievance redressal',
      explanation: 'No mandatory consumer care email or telephone number detected on the scanned panel.',
    },
    {
      id: 'rev-apex-6',
      scanId: 'scan-apex-demo-01',
      ruleId: 'LM-RULE-007',
      ruleName: 'Minimum Character Height & Font Size',
      sectionReference: 'Rule 7 & Rule 8',
      severity: 'HIGH',
      status: 'POTENTIAL_NON_COMPLIANCE',
      confidence: 0.76,
      detectedValue: '1.7 mm (estimated)',
      expectedRequirement: 'Minimum 2.0 mm based on 200g net quantity',
      explanation: 'Estimated character height (1.7 mm) is below statutory minimum 2.0 mm.',
    },
  ];

  for (const r of apexRuleEvals) {
    db.insert(ruleEvaluations).values(r).onConflictDoNothing().run();
  }

  // 7. Seed Complaints (50+ realistic complaints across lifecycle)
  const complaintData = [
    {
      id: 'LM-2026-001284',
      scanId: 'scan-apex-demo-01',
      consumerId: 'usr-consumer',
      companyId: 'comp-apex',
      productId: 'prod-apex-biscuits',
      status: 'ESCALATED',
      consumerNotes: 'No consumer care email or phone number is visible on this 200g packet. Font is also extremely tiny to read in standard daylight.',
      consumerLocation: 'Sector 18, Noida, Uttar Pradesh',
      purchaseStore: 'SuperMart Hypermarket',
      createdAt: '2026-08-14T12:00:00Z',
      updatedAt: '2026-08-18T14:30:00Z',
    },
    {
      id: 'LM-2026-001285',
      scanId: 'scan-nova-demo-03',
      consumerId: 'usr-consumer',
      companyId: 'comp-nova',
      productId: 'prod-nova-dishwash',
      status: 'UNDER_COMPANY_REVIEW',
      consumerNotes: 'Font size for mandatory details is barely legible without magnifying glass. Prescribed 4mm minimum appears violated.',
      consumerLocation: 'Indiranagar, Bengaluru, Karnataka',
      purchaseStore: 'Local Kirana Store',
      createdAt: '2026-08-25T10:15:00Z',
      updatedAt: '2026-08-25T10:15:00Z',
    },
    {
      id: 'LM-2026-001286',
      scanId: 'scan-apex-demo-01',
      consumerId: 'usr-consumer',
      companyId: 'comp-urban',
      productId: 'prod-urban-wafers',
      status: 'VERIFIED',
      consumerNotes: 'Sold with dual MRP sticker slapped over original price. MRP obscured.',
      consumerLocation: 'Connaught Place, New Delhi',
      purchaseStore: 'Metro Station Convenience Kiosk',
      createdAt: '2026-08-10T14:00:00Z',
      updatedAt: '2026-08-12T16:00:00Z',
    },
    {
      id: 'LM-2026-001287',
      scanId: 'scan-apex-demo-01',
      consumerId: 'usr-consumer',
      companyId: 'comp-apex',
      productId: 'prod-apex-chips',
      status: 'RESOLVED',
      consumerNotes: 'Consumer care toll-free line was not picking up queries for packaging feedback.',
      consumerLocation: 'Gomti Nagar, Lucknow',
      purchaseStore: 'Family Mart',
      createdAt: '2026-07-28T11:00:00Z',
      updatedAt: '2026-08-04T10:00:00Z',
    },
  ];

  for (const comp of complaintData) {
    db.insert(complaints).values(comp).onConflictDoNothing().run();
  }

  // Generate 48 additional diverse customer reports with realistic everyday language
  const statuses = [
    'SUBMITTED',
    'UNDER_COMPANY_REVIEW',
    'COMPANY_RESPONDED',
    'ESCALATED',
    'UNDER_GOVERNMENT_REVIEW',
    'VERIFIED',
    'RESOLVED',
  ];
  const companyIds = companyData.map((c) => c.id);

  const realisticCustomerComments = [
    'Customer support email and phone number are missing from the back of the packet.',
    'Net weight text is way too tiny to read without a magnifying glass.',
    'Printed MRP on the box does not state if taxes are included or not.',
    'Manufacturing date and expiry date are smudged on the wrapper seam.',
    'Toll-free customer care phone number was dead when I called to ask about ingredients.',
    'Unit price per 100g is missing on this family pack.',
    'Manufacturer address only gives a city name without any street name or PIN code.',
    'There is a higher price sticker pasted over the original printed MRP.',
  ];

  const realisticStores = [
    'DMart Superstore',
    'Reliance Smart Point',
    'Local Grocery Mart',
    'Blinkit Delivery',
    'BigBasket Online',
    'Spencer\'s Hypermarket',
    'Nature\'s Basket',
    'FreshMart Corner',
  ];

  const realisticLocations = [
    'Indiranagar, Bengaluru',
    'Connaught Place, New Delhi',
    'Bandra West, Mumbai',
    'Gomti Nagar, Lucknow',
    'T. Nagar, Chennai',
    'Banjara Hills, Hyderabad',
    'Sector 18, Noida',
    'Alwarpet, Chennai',
  ];

  for (let i = 1288; i <= 1335; i++) {
    const randomCompId = companyIds[i % companyIds.length];
    const randomStatus = statuses[i % statuses.length];
    const day = 1 + (i % 28);
    const month = (i % 8) + 1;
    const dateStr = `2026-0${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}T10:${(i % 50) + 10}:00Z`;

    // Match product to company if possible
    const companyProducts = productData.filter((p) => p.companyId === randomCompId);
    const selectedProd = companyProducts.length > 0 ? companyProducts[i % companyProducts.length] : productData[0];

    db.insert(complaints)
      .values({
        id: `LM-2026-00${i}`,
        scanId: 'scan-apex-demo-01',
        consumerId: 'usr-consumer',
        companyId: randomCompId,
        productId: selectedProd.id,
        status: randomStatus,
        consumerNotes: realisticCustomerComments[i % realisticCustomerComments.length],
        consumerLocation: realisticLocations[i % realisticLocations.length],
        purchaseStore: realisticStores[i % realisticStores.length],
        createdAt: dateStr,
        updatedAt: dateStr,
      })
      .onConflictDoNothing()
      .run();
  }

  // 8. Seed Company Response for LM-2026-001284
  db.insert(companyResponses)
    .values({
      id: 'resp-001284',
      complaintId: 'LM-2026-001284',
      companyId: 'comp-apex',
      responseText:
        'We acknowledge the consumer feedback regarding the consumer care contact details on batch APX-9824. While our corporate office address was printed on the seal fold, we have updated the artwork to place the 1800-tollfree and email directly on the primary display panel with 2.2 mm font height.',
      correctiveActionType: 'PACKAGING_REVISION',
      correctedLabelImageUrl: '/samples/apex_biscuits_corrected.svg',
      batchNumber: 'APX-9824',
      submittedAt: '2026-08-16T15:20:00Z',
    })
    .onConflictDoNothing()
    .run();

  // 9. Seed Government Review for LM-2026-001286
  db.insert(governmentReviews)
    .values({
      id: 'gov-rev-001286',
      complaintId: 'LM-2026-001286',
      officerId: 'usr-officer',
      officerName: 'Sunita Meena, IO-LM',
      decision: 'VERIFIED_VIOLATION',
      officerNotes:
        'Physical verification at retail premise confirmed dual MRP sticker tampering violating Section 18 read with Rule 18(2) of Legal Metrology PC Rules. Compounding show-cause notice issued to manufacturer and distributor.',
      penaltyNoticeSection: 'Section 36(1) of Legal Metrology Act, 2009',
      penaltyAmount: 25000,
      reviewDate: '2026-08-12T16:00:00Z',
    })
    .onConflictDoNothing()
    .run();

  // 10. Seed Inspections
  db.insert(inspections)
    .values({
      id: 'insp-2026-089',
      complaintId: 'LM-2026-001286',
      companyId: 'comp-urban',
      assignedOfficerId: 'usr-officer',
      assignedOfficerName: 'Sunita Meena, IO-LM',
      facilityAddress: 'B-34, Okhla Phase II, New Delhi - 110020',
      scheduledDate: '2026-09-15',
      status: 'SCHEDULED',
      findingsSummary: 'Scheduled warehouse spot-audit for batch labeling verification and net quantity verification.',
      enforcementAction: 'NOTICE_ISSUED',
      createdAt: '2026-08-13T10:00:00Z',
    })
    .onConflictDoNothing()
    .run();

  // 11. Seed Audit Logs
  const demoAuditLogs = [
    {
      id: 'aud-001',
      actorId: 'usr-consumer',
      actorRole: 'CONSUMER',
      action: 'SCAN_UPLOADED',
      entityType: 'SCAN',
      entityId: 'scan-apex-demo-01',
      detailsJson: JSON.stringify({ filename: 'apex_biscuits_pack.jpg', score: 62 }),
      timestamp: '2026-08-14T11:20:00Z',
    },
    {
      id: 'aud-002',
      actorId: 'usr-consumer',
      actorRole: 'CONSUMER',
      action: 'COMPLAINT_FILED',
      entityType: 'COMPLAINT',
      entityId: 'LM-2026-001284',
      detailsJson: JSON.stringify({ issue: 'Missing Consumer Care & Font Size' }),
      timestamp: '2026-08-14T12:00:00Z',
    },
    {
      id: 'aud-003',
      actorId: 'usr-company',
      actorRole: 'COMPANY',
      action: 'COMPANY_RESPONDED',
      entityType: 'COMPLAINT',
      entityId: 'LM-2026-001284',
      detailsJson: JSON.stringify({ action: 'PACKAGING_REVISION' }),
      timestamp: '2026-08-16T15:20:00Z',
    },
    {
      id: 'aud-004',
      actorId: 'usr-officer',
      actorRole: 'GOVERNMENT_OFFICER',
      action: 'VERIFIED_VIOLATION',
      entityType: 'COMPLAINT',
      entityId: 'LM-2026-001286',
      detailsJson: JSON.stringify({ penalty: 25000, rule: 'Rule 18(2)' }),
      timestamp: '2026-08-12T16:00:00Z',
    },
  ];

  for (const aud of demoAuditLogs) {
    db.insert(auditLogs).values(aud).onConflictDoNothing().run();
  }

  console.log('✅ Database seeded successfully with companies, products, scans, complaints, and audit records.');
}

if (process.argv[1] && process.argv[1].includes('seed.ts')) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seed error:', err);
      process.exit(1);
    });
}
