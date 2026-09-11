import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface FileStorageResult {
  filePath: string;
  publicUrl: string;
  originalName: string;
  size: number;
  mimeType: string;
}

export class StorageService {
  private static uploadDir = path.resolve(process.cwd(), 'uploads');

  public static init() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  public static async saveBuffer(
    buffer: Buffer,
    originalName: string,
    mimeType: string = 'image/jpeg'
  ): Promise<FileStorageResult> {
    this.init();
    const ext = path.extname(originalName) || '.jpg';
    const randomHex = crypto.randomBytes(8).toString('hex');
    const safeName = `scan_${Date.now()}_${randomHex}${ext}`;
    const targetPath = path.join(this.uploadDir, safeName);

    await fs.promises.writeFile(targetPath, buffer);

    return {
      filePath: targetPath,
      publicUrl: `/uploads/${safeName}`,
      originalName,
      size: buffer.length,
      mimeType,
    };
  }

  public static async saveBase64(base64Data: string, originalName: string = 'image.png'): Promise<FileStorageResult> {
    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    let buffer: Buffer;
    let mimeType = 'image/png';

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64Data, 'base64');
    }

    return this.saveBuffer(buffer, originalName, mimeType);
  }
}
