import type { RedisOptions } from 'ioredis';
import { env } from '@/@env';

export const redisConfig: RedisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  db: env.REDIS_DB,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    return targetErrors.some((e) => err.message.includes(e));
  },
};

export const cacheConfig = {
  /** TTL padrão para cache de permissões (5 minutos) */
  permissions: 5 * 60,
  /** TTL padrão para cache de sessões (30 minutos) */
  sessions: 30 * 60,
  /** TTL padrão para cache de usuários (10 minutos) */
  users: 10 * 60,
  /** TTL padrão para cache genérico (5 minutos) */
  default: 5 * 60,
} as const;

export const cacheKeys = {
  permissions: (userId: string) => `permissions:user:${userId}`,
  session: (sessionId: string) => `session:${sessionId}`,
  user: (userId: string) => `user:${userId}`,
  rateLimit: (ip: string, endpoint: string) => `rate-limit:${ip}:${endpoint}`,
} as const;
