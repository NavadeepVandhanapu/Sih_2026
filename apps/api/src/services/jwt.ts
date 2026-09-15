import crypto from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'sih-legal-metrology-secret-key-2026-doca-compliance-platform';
const EXPIRES_IN_SECONDS = 86400; // 24 hours

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'CONSUMER' | 'COMPANY' | 'GOVERNMENT_OFFICER' | 'ADMIN';
  companyId?: string | null;
  name?: string;
  iat?: number;
  exp?: number;
}

function base64UrlEncode(str: string | Buffer): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

export class JwtService {
  public static sign(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JwtPayload = {
      ...payload,
      iat: now,
      exp: now + EXPIRES_IN_SECONDS,
    };

    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(signatureInput)
      .digest();
    const encodedSignature = base64UrlEncode(signature);

    return `${signatureInput}.${encodedSignature}`;
  }

  public static verify(token: string): JwtPayload | null {
    try {
      if (!token || typeof token !== 'string') return null;

      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [encodedHeader, encodedPayload, encodedSignature] = parts;
      const signatureInput = `${encodedHeader}.${encodedPayload}`;
      
      const expectedSignatureBuf = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(signatureInput)
        .digest();
      const expectedSignature = base64UrlEncode(expectedSignatureBuf);

      const sigBuf = Buffer.from(encodedSignature);
      const expectedBuf = Buffer.from(expectedSignature);

      if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
        return null;
      }

      const payload: JwtPayload = JSON.parse(base64UrlDecode(encodedPayload));
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < now) {
        return null; // Expired
      }

      return payload;
    } catch {
      return null;
    }
  }
}
