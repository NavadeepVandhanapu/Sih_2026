import { describe, it, expect, beforeAll } from 'vitest';
import { JwtService } from '../services/jwt.js';

describe('JWT & Authentication Service', () => {
  it('should sign and verify valid JWT tokens', () => {
    const payload = {
      userId: 'usr-consumer-123',
      email: 'consumer@demo.com',
      role: 'CONSUMER' as const,
      companyId: null,
      name: 'Test Consumer',
    };

    const token = JwtService.sign(payload);
    expect(typeof token).toBe('string');

    const decoded = JwtService.verify(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe('usr-consumer-123');
    expect(decoded?.email).toBe('consumer@demo.com');
    expect(decoded?.role).toBe('CONSUMER');
  });

  it('should reject tampered or malformed JWT tokens', () => {
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature';
    const decoded = JwtService.verify(invalidToken);
    expect(decoded).toBeNull();
  });

  it('should reject empty or non-string tokens', () => {
    expect(JwtService.verify('')).toBeNull();
    expect(JwtService.verify(null as any)).toBeNull();
  });
});
