import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getRedisClient } from '@/lib/redis';

const IDEMPOTENCY_TTL = 86400; // 24 hours
const IDEMPOTENCY_HEADER = 'idempotency-key';

/**
 * Idempotency plugin for POST/PUT requests.
 *
 * When a client sends a request with an `Idempotency-Key` header,
 * the response is cached in Redis. Subsequent requests with the same key
 * return the cached response without re-executing the handler.
 *
 * This prevents duplicate operations (e.g., double-creating a finance entry)
 * caused by network retries or client bugs.
 */
export async function idempotencyPlugin(app: FastifyInstance) {
  app.addHook(
    'preHandler',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!['POST', 'PUT'].includes(request.method)) return;

      const key = request.headers[IDEMPOTENCY_HEADER] as string | undefined;
      if (!key) return;

      try {
        const redis = getRedisClient();
        const cached = await redis.get(`idem:${key}`);

        if (cached) {
          const { statusCode, body } = JSON.parse(cached);
          reply.header('X-Idempotency-Replayed', 'true');
          return reply.status(statusCode).send(body);
        }
      } catch {
        // If Redis is down, proceed without idempotency (fail-open)
      }
    },
  );

  app.addHook(
    'onSend',
    async (
      request: FastifyRequest,
      reply: FastifyReply,
      payload: string | null,
    ) => {
      if (!['POST', 'PUT'].includes(request.method)) return payload;

      const key = request.headers[IDEMPOTENCY_HEADER] as string | undefined;
      if (!key) return payload;

      // Only cache successful responses
      if (reply.statusCode >= 400) return payload;

      // Don't cache replayed responses
      if (reply.getHeader('X-Idempotency-Replayed')) return payload;

      try {
        const redis = getRedisClient();
        const data = JSON.stringify({
          statusCode: reply.statusCode,
          body: payload ? JSON.parse(payload as string) : null,
        });
        await redis.set(`idem:${key}`, data, 'EX', IDEMPOTENCY_TTL);
      } catch {
        // Non-critical, ignore
      }

      return payload;
    },
  );
}
