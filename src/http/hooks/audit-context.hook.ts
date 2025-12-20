import type { FastifyReply, FastifyRequest } from 'fastify';
import { AsyncLocalStorage } from 'node:async_hooks';

export interface AuditContext {
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  endpoint?: string;
  method?: string;
}

// AsyncLocalStorage para armazenar contexto de auditoria
export const auditContextStorage = new AsyncLocalStorage<AuditContext>();

/**
 * Hook Fastify para capturar contexto de auditoria em cada request
 * Usa AsyncLocalStorage para disponibilizar o contexto em qualquer parte do código
 */
export async function auditContextHook(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const context: AuditContext = {
    userId: (request.user as any)?.sub || null,
    ip: getClientIp(request),
    userAgent: request.headers['user-agent'] || null,
    endpoint: request.url,
    method: request.method,
  };

  // Executa o resto da request dentro do contexto
  return new Promise((resolve, reject) => {
    auditContextStorage.run(context, async () => {
      try {
        await Promise.resolve();
        resolve(undefined);
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Helper para obter o contexto de auditoria atual
 * Pode ser chamado de qualquer lugar dentro de uma request
 */
export function getAuditContext(): AuditContext | undefined {
  return auditContextStorage.getStore();
}

/**
 * Extrai o IP real do cliente considerando proxies
 */
function getClientIp(request: FastifyRequest): string | null {
  const xForwardedFor = request.headers['x-forwarded-for'];
  const xRealIp = request.headers['x-real-ip'];

  if (xForwardedFor) {
    const ips = Array.isArray(xForwardedFor)
      ? xForwardedFor[0]
      : xForwardedFor;
    return ips.split(',')[0]?.trim() || null;
  }

  if (xRealIp) {
    return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
  }

  return request.ip || null;
}
