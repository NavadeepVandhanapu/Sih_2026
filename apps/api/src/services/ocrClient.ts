import fs from 'node:fs';
import path from 'node:path';

export interface OCRBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OCRRegionItem {
  text: string;
  confidence: number;
  boundingBox: OCRBoundingBox;
  polygon: number[][];
}

export interface QualityMetrics {
  score: number;
  blur_variance: number;
  brightness: number;
  contrast: number;
  resolution_status: string;
  is_usable: boolean;
}

export interface PythonOCRResponse {
  success: boolean;
  provider: string;
  image: {
    width: number;
    height: number;
    channels: number;
  };
  quality: QualityMetrics;
  rawText: string;
  wordCount: number;
  lines: string[];
  regions: OCRRegionItem[];
  error?: string;
}

export class OCRClient {
  private static serviceUrl = process.env.OCR_SERVICE_URL || 'http://127.0.0.1:8000';

  public static async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.serviceUrl}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }

  public static async processImage(
    imagePathOrBuffer: string | Buffer,
    filename: string = 'scan.jpg',
    mimeType: string = 'image/jpeg'
  ): Promise<PythonOCRResponse> {
    try {
      let buffer: Buffer;
      if (typeof imagePathOrBuffer === 'string') {
        const absolutePath = path.isAbsolute(imagePathOrBuffer)
          ? imagePathOrBuffer
          : path.resolve(process.cwd(), imagePathOrBuffer);

        if (!fs.existsSync(absolutePath)) {
          throw new Error(`IMAGE_NOT_FOUND: File does not exist at '${absolutePath}'`);
        }
        buffer = fs.readFileSync(absolutePath);
        filename = path.basename(absolutePath);
      } else {
        buffer = imagePathOrBuffer;
      }

      const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
      const formData = new FormData();
      formData.append('file', blob, filename);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      const res = await fetch(`${this.serviceUrl}/ocr`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OCR_SERVICE_ERROR: HTTP ${res.status} - ${errText}`);
      }

      const data = (await res.json()) as PythonOCRResponse;

      if (!data.success) {
        throw new Error(data.error || 'OCR_FAILED: Python OCR processing was unsuccessful');
      }

      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('OCR_TIMEOUT: Python OCR service request timed out');
      }
      if (err.message.includes('ECONNREFUSED') || err.message.includes('fetch failed')) {
        throw new Error('OCR_SERVICE_UNAVAILABLE: Unable to connect to Python AI OCR Service at ' + this.serviceUrl);
      }
      throw err;
    }
  }
}
