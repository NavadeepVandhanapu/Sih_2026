export interface OCROutput {
  rawText: string;
  confidence: number;
  wordCount: number;
  lines: string[];
  charHeightPxEstimate?: number;
  provider: string;
}

export abstract class OCRService {
  abstract processImage(imageBufferOrUrl: Buffer | string): Promise<OCROutput>;
  abstract getProviderName(): string;
}

/**
 * Standard Mock/Pre-indexed OCR Provider for instant, deterministic, high-accuracy demo scans
 */
export class MockDemoOCRService extends OCRService {
  private customText?: string;

  constructor(customText?: string) {
    super();
    this.customText = customText;
  }

  getProviderName(): string {
    return 'Demo Calibration OCR Engine (v2.4)';
  }

  async processImage(imageBufferOrUrl: Buffer | string): Promise<OCROutput> {
    if (this.customText) {
      return {
        rawText: this.customText,
        confidence: 0.94,
        wordCount: this.customText.split(/\s+/).length,
        lines: this.customText.split('\n'),
        charHeightPxEstimate: 24,
        provider: this.getProviderName(),
      };
    }

    // Default rich sample text
    const defaultSample = `
PRE-PACKED FOOD COMMODITY
Apex Cream Biscuits - 200 g
Manufactured by: Apex Foods Pvt. Ltd., Plot 42, Industrial Area, Sector 5, Haridwar, Uttarakhand - 249403
Net Quantity: 200 g
MRP: Rs. 40.00 (inclusive of all taxes)
Date of Packing: 08/2026
Batch No: APX-9824
Consumer Care Cell: Phone: 1800-200-8899, Email: care@apexfoods.in
Address: Same as above
Unit Sale Price: Rs. 0.20 per g
Made in India
`.trim();

    return {
      rawText: defaultSample,
      confidence: 0.96,
      wordCount: defaultSample.split(/\s+/).length,
      lines: defaultSample.split('\n'),
      charHeightPxEstimate: 26,
      provider: this.getProviderName(),
    };
  }
}
