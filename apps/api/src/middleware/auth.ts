import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtService, JwtPayload } from '../services/jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<JwtPayload | undefined> {
  const authHeader = request.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if ((request.query as { token?: string })?.token) {
    token = (request.query as { token?: string }).token;
  }

  if (!token) {
    reply.status(401).send({ error: 'Unauthorized: Missing authentication token' });
    return undefined;
  }

  const payload = JwtService.verify(token);
  if (!payload) {
    reply.status(401).send({ error: 'Unauthorized: Invalid or expired token' });
    return undefined;
  }

  request.user = payload;
  return payload;
}

export function requireRole(...allowedRoles: Array<'CONSUMER' | 'COMPANY' | 'GOVERNMENT_OFFICER' | 'ADMIN'>) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<boolean> => {
    if (!request.user) {
      const payload = await authenticate(request, reply);
      if (!payload) return false;
    }

    if (!allowedRoles.includes(request.user!.role)) {
      reply.status(403).send({
        error: `Forbidden: Statutory role requirement [${allowedRoles.join(', ')}] not satisfied by role '${request.user!.role}'`,
      });
      return false;
    }

    return true;
  };
}

export function checkCompanyAccess(user: JwtPayload, targetCompanyId: string): boolean {
  if (user.role === 'ADMIN' || user.role === 'GOVERNMENT_OFFICER') {
    return true;
  }
  if (user.role === 'COMPANY' && user.companyId === targetCompanyId) {
    return true;
  }
  return false;
}
