import { FastifyRequest, FastifyReply } from 'fastify';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const stores = new Map<string, Map<string, RateLimitRecord>>();

export function createRateLimiter(options: { windowMs: number; max: number; keyPrefix: string }) {
  const windowMs = options.windowMs;
  const maxRequests = options.max;
  const keyPrefix = options.keyPrefix;

  if (!stores.has(keyPrefix)) {
    stores.set(keyPrefix, new Map<string, RateLimitRecord>());
  }

  const store = stores.get(keyPrefix)!;

  return async (request: FastifyRequest, reply: FastifyReply): Promise<boolean> => {
    const ip = request.ip || request.socket.remoteAddress || '127.0.0.1';
    const userId = request.user?.userId || ip;
    const clientKey = `${userId}`;
    const now = Date.now();

    const record = store.get(clientKey);

    if (!record || now > record.resetTime) {
      store.set(clientKey, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxRequests) {
      reply.status(429).send({
        error: 'Too Many Requests: Rate limit exceeded. Please wait before retrying.',
        retryAfterMs: record.resetTime - now,
      });
      return false;
    }

    record.count++;
    return true;
  };
}

export const loginRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_LOGIN || '15', 10),
  keyPrefix: 'login',
});

export const scanRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_SCAN || '30', 10),
  keyPrefix: 'scan',
});

export const complaintRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_COMPLAINT || '20', 10),
  keyPrefix: 'complaint',
});
