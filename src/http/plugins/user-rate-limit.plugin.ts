import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { getRedisClient } from '@/lib/redis';
import { env } from '@/@env';

/**
 * Configuração de rate limit por tier de usuário
 */
interface UserRateLimitConfig {
  /** Requests por minuto para usuários não autenticados */
  anonymous: number;
  /** Requests por minuto para usuários autenticados */
  authenticated: number;
  /** Requests por minuto para usuários premium/admin */
  premium: number;
}

const config: UserRateLimitConfig = {
  anonymous: 60, // 60 req/min (1 req/s)
  authenticated: 200, // 200 req/min (~3.3 req/s)
  premium: 500, // 500 req/min (~8.3 req/s)
};

/**
 * Determina o tier do usuário baseado em suas permissões
 */
function getUserTier(request: FastifyRequest): keyof UserRateLimitConfig {
  const user = request.user as
    | { sub?: string; permissions?: string[] }
    | undefined;

  if (!user || !user.sub) {
    return 'anonymous';
  }

  // Usuários com permissões administrativas são premium
  const permissions = user.permissions || [];
  const isAdmin = permissions.some(
    (p) => p.startsWith('rbac.') || p === 'admin.*',
  );

  if (isAdmin) {
    return 'premium';
  }

  return 'authenticated';
}

/**
 * Gera a chave Redis para rate limiting
 */
function getRateLimitKey(request: FastifyRequest): string {
  const user = request.user as { sub?: string } | undefined;

  if (user && user.sub) {
    return `rate-limit:user:${user.sub}`;
  }

  return `rate-limit:ip:${request.ip}`;
}

/**
 * Plugin de rate limiting por usuário
 *
 * Este plugin implementa rate limiting diferenciado:
 * - Por IP para usuários não autenticados
 * - Por userId para usuários autenticados
 * - Limites diferentes por tier (anonymous, authenticated, premium)
 *
 * Headers retornados:
 * - X-RateLimit-Limit: Limite máximo
 * - X-RateLimit-Remaining: Requisições restantes
 * - X-RateLimit-Reset: Timestamp de reset (em segundos)
 */
const userRateLimitPlugin: FastifyPluginAsync<{
  /** Endpoints a ignorar (ex: /health) */
  skip?: string[];
  /** Tempo da janela em segundos (padrão: 60) */
  windowSeconds?: number;
}> = async (app, options) => {
  const skipPaths = options.skip || [
    '/health',
    '/health/live',
    '/health/ready',
  ];
  const windowSeconds = options.windowSeconds || 60;

  app.addHook(
    'preHandler',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Pular endpoints configurados
      if (skipPaths.some((path) => request.url.startsWith(path))) {
        return;
      }

      // Pular em testes para evitar flakiness
      if (env.NODE_ENV === 'test') {
        return;
      }

      const redis = getRedisClient();
      const tier = getUserTier(request);
      const limit = config[tier];
      const key = getRateLimitKey(request);

      try {
        // Incrementa contador
        const current = await redis.incr(key);

        // Define TTL na primeira requisição
        if (current === 1) {
          await redis.expire(key, windowSeconds);
        }

        // Obtém TTL restante
        const ttl = await redis.ttl(key);
        const resetAt =
          Math.floor(Date.now() / 1000) + (ttl > 0 ? ttl : windowSeconds);
        const remaining = Math.max(0, limit - current);

        // Define headers de rate limit
        reply.header('X-RateLimit-Limit', limit);
        reply.header('X-RateLimit-Remaining', remaining);
        reply.header('X-RateLimit-Reset', resetAt);

        // Verifica se excedeu o limite
        if (current > limit) {
          reply.header('Retry-After', ttl > 0 ? ttl : windowSeconds);

          return reply.status(429).send({
            statusCode: 429,
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${ttl > 0 ? ttl : windowSeconds} seconds.`,
            retryAfter: ttl > 0 ? ttl : windowSeconds,
          });
        }
      } catch (error) {
        // Em caso de erro do Redis, permite a requisição
        // Melhor ter disponibilidade do que bloquear por erro de cache
        console.error('[UserRateLimit] Redis error:', error);
      }
    },
  );
};

export default fp(userRateLimitPlugin, {
  name: 'user-rate-limit',
  fastify: '5.x',
});

/**
 * Helper para resetar rate limit de um usuário
 * Útil após ações administrativas ou em casos especiais
 */
export async function resetUserRateLimit(userId: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(`rate-limit:user:${userId}`);
}

/**
 * Helper para resetar rate limit de um IP
 */
export async function resetIpRateLimit(ip: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(`rate-limit:ip:${ip}`);
}

/**
 * Helper para obter status atual de rate limit
 */
export async function getRateLimitStatus(
  identifier: string,
  type: 'user' | 'ip' = 'user',
): Promise<{
  current: number;
  limit: number;
  remaining: number;
  ttl: number;
} | null> {
  const redis = getRedisClient();
  const key = `rate-limit:${type}:${identifier}`;

  const [current, ttl] = await Promise.all([redis.get(key), redis.ttl(key)]);

  if (!current) {
    return null;
  }

  const currentNum = parseInt(current, 10);
  const limit = type === 'user' ? config.authenticated : config.anonymous;

  return {
    current: currentNum,
    limit,
    remaining: Math.max(0, limit - currentNum),
    ttl: ttl > 0 ? ttl : 0,
  };
}
