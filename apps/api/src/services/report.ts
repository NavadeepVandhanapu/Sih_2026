import PDFDocument from 'pdfkit';
import fs from 'node:fs';
import path from 'node:path';

export interface ReportData {
  reportId: string;
  generatedDate: string;
  product: {
    name: string;
    brand: string;
    category: string;
    netQuantity?: string;
    mrp?: string;
  };
  company: {
    name: string;
    registrationNo: string;
    address: string;
    riskScore: number;
  };
  scan: {
    scanId: string;
    overallScore: number;
    overallStatus: string;
    ruleSetVersion: string;
    ocrConfidence: number;
  };
  declarations: Array<{
    label: string;
    detectedValue: string | null;
    confidence: number;
  }>;
  ruleResults: Array<{
    ruleName: string;
    sectionReference: string;
    status: string;
    confidence: number;
    detectedValue: string | null;
    expectedRequirement: string;
    explanation: string;
  }>;
  fontAnalysis: {
    estimatedCharHeightMm: number;
    requiredMinimumMm: number;
    status: string;
    explanation: string;
  };
  complaint?: {
    complaintId: string;
    status: string;
    consumerNotes?: string;
    createdAt: string;
  };
  companyResponse?: {
    responseText: string;
    correctiveActionType?: string;
    submittedAt: string;
  };
  governmentReview?: {
    officerName: string;
    decision: string;
    officerNotes: string;
    reviewDate: string;
    penaltyAmount?: number;
  };
}

export class ReportService {
  public static async generatePDF(data: ReportData, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      // Header Banner
      doc
        .rect(0, 0, doc.page.width, 70)
        .fill('#1e293b');

      doc
        .fillColor('#ffffff')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('GOVERNMENT OF INDIA', 40, 18, { align: 'left' })
        .fontSize(10)
        .font('Helvetica')
        .text('Ministry of Consumer Affairs, Food & Public Distribution | Department of Consumer Affairs', 40, 36)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('LEGAL METROLOGY COMPLIANCE & INSPECTION REPORT', 40, 50);

      doc.moveDown(3);

      // Report Metadata Box
      doc
        .fillColor('#334155')
        .fontSize(9)
        .font('Helvetica')
        .text(`Report Reference ID: ${data.reportId}`, 40, 85)
        .text(`Generated On: ${data.generatedDate}`, 40, 98)
        .text(`Rule Set Version: Legal Metrology (PC) Rules 2011 [v${data.scan.ruleSetVersion}]`, 40, 111);

      const statusColor = data.scan.overallStatus === 'COMPLIANT' ? '#16a34a' : '#ea580c';
      doc
        .rect(380, 85, 175, 40)
        .fillAndStroke('#f8fafc', statusColor);

      doc
        .fillColor(statusColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('SCREENING STATUS:', 390, 92)
        .fontSize(11)
        .text(data.scan.overallStatus.replace(/_/g, ' '), 390, 107);

      doc.moveDown(4);

      // Section: Product & Manufacturer
      doc
        .rect(40, 140, 515, 20)
        .fill('#f1f5f9');
      doc
        .fillColor('#0f172a')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('1. COMMODITY & MANUFACTURER PROFILE', 45, 145);

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#1e293b')
        .text(`Product Name: ${data.product.name} (${data.product.brand})`, 45, 170)
        .text(`Category: ${data.product.category}`, 45, 184)
        .text(`Net Quantity: ${data.product.netQuantity || 'N/A'} | MRP: ${data.product.mrp || 'N/A'}`, 45, 198)
        .text(`Manufacturer/Packer: ${data.company.name}`, 300, 170)
        .text(`Registration No: ${data.company.registrationNo}`, 300, 184)
        .text(`Risk Index: ${data.company.riskScore}/100`, 300, 198);

      // Section: Mandatory Declarations
      doc
        .rect(40, 225, 515, 20)
        .fill('#f1f5f9');
      doc
        .fillColor('#0f172a')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('2. EXTRACTED MANDATORY DECLARATIONS (RULE 6)', 45, 230);

      let yPos = 252;
      for (const dec of data.declarations) {
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#334155')
          .text(dec.label, 45, yPos, { width: 180 })
          .font('Helvetica')
          .fillColor('#0f172a')
          .text(dec.detectedValue || '[NOT CONFIDENTLY DETECTED]', 230, yPos, { width: 230 })
          .font('Helvetica')
          .fillColor('#64748b')
          .text(`Conf: ${(dec.confidence * 100).toFixed(0)}%`, 470, yPos);
        yPos += 16;
      }

      // Section: Readability & Font Analysis
      yPos += 10;
      doc
        .rect(40, yPos, 515, 20)
        .fill('#f1f5f9');
      doc
        .fillColor('#0f172a')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('3. READABILITY & MINIMUM CHARACTER HEIGHT (RULE 7 & 8)', 45, yPos + 5);

      yPos += 28;
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#1e293b')
        .text(`Estimated Char Height: ${data.fontAnalysis.estimatedCharHeightMm} mm`, 45, yPos)
        .text(`Statutory Min Required: ${data.fontAnalysis.requiredMinimumMm} mm`, 230, yPos)
        .text(`Status: ${data.fontAnalysis.status.replace(/_/g, ' ')}`, 400, yPos);

      yPos += 16;
      doc
        .fontSize(8.5)
        .fillColor('#475569')
        .text(`Remarks: ${data.fontAnalysis.explanation}`, 45, yPos, { width: 505 });

      // Section: Grievance / Verification / Inspection Status
      yPos += 30;
      doc
        .rect(40, yPos, 515, 20)
        .fill('#f1f5f9');
      doc
        .fillColor('#0f172a')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('4. ENFORCEMENT & GRIEVANCE AUDIT TRAIL', 45, yPos + 5);

      yPos += 28;
      if (data.complaint) {
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#334155')
          .text(`Grievance Ref: ${data.complaint.complaintId} (${data.complaint.status})`, 45, yPos);
        yPos += 14;
      }

      if (data.companyResponse) {
        doc
          .fontSize(8.5)
          .font('Helvetica')
          .fillColor('#1e293b')
          .text(`Company Response: ${data.companyResponse.responseText} [Action: ${data.companyResponse.correctiveActionType || 'Notified'}]`, 45, yPos, { width: 505 });
        yPos += 20;
      }

      if (data.governmentReview) {
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor('#b91c1c')
          .text(`Officer Finding: ${data.governmentReview.decision.replace(/_/g, ' ')} by ${data.governmentReview.officerName} on ${data.governmentReview.reviewDate}`, 45, yPos);
        yPos += 14;
        doc
          .fontSize(8.5)
          .font('Helvetica')
          .fillColor('#334155')
          .text(`Order Notes: ${data.governmentReview.officerNotes}`, 45, yPos, { width: 505 });
        yPos += 20;
      }

      // Disclaimer Banner
      doc
        .rect(40, doc.page.height - 75, 515, 45)
        .fill('#fef2f2');
      doc
        .fillColor('#991b1b')
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .text('LEGAL NOTICE & STATUTORY DISCLAIMER:', 45, doc.page.height - 70)
        .font('Helvetica')
        .text(
          'This document is an AI-assisted screening assessment generated under the DoCA Legal Metrology Enforcement Support System. ' +
          'Findings labeled "Potential Non-Compliance" do not constitute final judicial guilt. ' +
          'Final compoundings, seizures, and statutory penalties require human verification by an authorized Legal Metrology Inspector under the Legal Metrology Act, 2009.',
          45,
          doc.page.height - 60,
          { width: 505 }
        );

      doc.end();

      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    });
  }

  public static generateJSON(data: ReportData): string {
    return JSON.stringify(data, null, 2);
  }
}
