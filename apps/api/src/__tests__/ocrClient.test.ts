import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OCRClient, PythonOCRResponse } from '../services/ocrClient.js';

describe('OCRClient Unit & Integration Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('checkHealth returns false when service is unreachable', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('fetch failed ECONNREFUSED'));
    const isHealthy = await OCRClient.checkHealth();
    expect(isHealthy).toBe(false);
  });

  it('checkHealth returns true when service returns HTTP 200', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'online' }),
    } as any);

    const isHealthy = await OCRClient.checkHealth();
    expect(isHealthy).toBe(true);
  });

  it('processImage throws IMAGE_NOT_FOUND if file path does not exist', async () => {
    await expect(OCRClient.processImage('/non/existent/path/image.jpg')).rejects.toThrow(
      'IMAGE_NOT_FOUND'
    );
  });

  it('processImage parses successful OCR response from buffer', async () => {
    const mockResponse: PythonOCRResponse = {
      success: true,
      provider: 'EasyOCR (PyTorch)',
      image: {
        width: 1920,
        height: 1080,
        channels: 3,
      },
      quality: {
        score: 0.92,
        blur_variance: 450.5,
        brightness: 128.0,
        contrast: 64.2,
        resolution_status: 'GOOD',
        is_usable: true,
      },
      rawText: 'Apex Premium Biscuits Net Quantity 200 g MRP Rs 40',
      wordCount: 9,
      lines: ['Apex Premium Biscuits', 'Net Quantity 200 g', 'MRP Rs 40'],
      regions: [
        {
          text: 'Net Quantity 200 g',
          confidence: 0.96,
          boundingBox: { x: 100, y: 200, width: 300, height: 50 },
          polygon: [[100, 200], [400, 200], [400, 250], [100, 250]],
        },
        {
          text: 'MRP Rs 40',
          confidence: 0.94,
          boundingBox: { x: 100, y: 300, width: 200, height: 40 },
          polygon: [[100, 300], [300, 300], [300, 340], [100, 340]],
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const dummyBuffer = Buffer.from('fake-image-data');
    const result = await OCRClient.processImage(dummyBuffer, 'test.jpg', 'image/jpeg');

    expect(result.success).toBe(true);
    expect(result.image.width).toBe(1920);
    expect(result.image.height).toBe(1080);
    expect(result.quality.resolution_status).toBe('GOOD');
    expect(result.regions).toHaveLength(2);
    expect(result.regions[0].text).toBe('Net Quantity 200 g');
    expect(result.regions[0].confidence).toBe(0.96);
    expect(result.regions[0].boundingBox).toEqual({ x: 100, y: 200, width: 300, height: 50 });
  });

  it('processImage handles OCR_SERVICE_UNAVAILABLE on fetch failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('fetch failed ECONNREFUSED'));
    const dummyBuffer = Buffer.from('fake-image-data');

    await expect(OCRClient.processImage(dummyBuffer)).rejects.toThrow('OCR_SERVICE_UNAVAILABLE');
  });

  it('processImage handles OCR_TIMEOUT on request abort', async () => {
    const abortErr = new Error('The operation was aborted');
    abortErr.name = 'AbortError';

    global.fetch = vi.fn().mockRejectedValue(abortErr);
    const dummyBuffer = Buffer.from('fake-image-data');

    await expect(OCRClient.processImage(dummyBuffer)).rejects.toThrow('OCR_TIMEOUT');
  });

  it('processImage throws error on HTTP error from OCR service', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Unsupported image format',
    } as any);
    const dummyBuffer = Buffer.from('fake-image-data');

    await expect(OCRClient.processImage(dummyBuffer)).rejects.toThrow('OCR_SERVICE_ERROR');
  });
});
