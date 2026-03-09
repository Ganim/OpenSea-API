import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getRedisClient } from '@/lib/redis';

const MAX_FAILED_ATTEMPTS = 10;
const BLOCK_WINDOW_SECONDS = 15 * 60; // 15 minutes

/**
 * Tracks failed login attempts per IP.
 * After MAX_FAILED_ATTEMPTS in BLOCK_WINDOW, the IP is blocked from further login attempts.
 *
 * Usage: call `recordLoginFailure(ip)` on auth failure,
 *        call `clearLoginFailures(ip)` on auth success.
 */

function getKey(ip: string): string {
  return `login_fail:${ip}`;
}

export async function isIpBlocked(ip: string): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const failures = await redis.get(getKey(ip));
    return failures !== null && parseInt(failures, 10) >= MAX_FAILED_ATTEMPTS;
  } catch {
    // If Redis is down, allow the request (fail open)
    return false;
  }
}

export async function recordLoginFailure(ip: string): Promise<number> {
  try {
    const redis = getRedisClient();
    const key = getKey(ip);
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, BLOCK_WINDOW_SECONDS);
    }
    return count;
  } catch {
    return 0;
  }
}

export async function clearLoginFailures(ip: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(getKey(ip));
  } catch {
    // Non-critical, ignore
  }
}

/**
 * Fastify plugin that blocks login attempts from IPs with too many failures.
 * Register on auth routes only.
 */
export async function loginBruteforceGuard(app: FastifyInstance) {
  app.addHook(
    'preHandler',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (await isIpBlocked(request.ip)) {
        return reply.status(429).send({
          code: 'RATE_LIMITED',
          message:
            'Muitas tentativas de login falharam. Tente novamente em 15 minutos.',
          requestId: request.requestId,
        });
      }
    },
  );
}
