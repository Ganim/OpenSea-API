/**
 * Phase 9 / Plan 09-02 — GET /v1/hr/punch/audit/drift-ranking
 * Top-5 devices by avg clock drift.
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { makeGetDriftRankingUseCase } from '@/use-cases/hr/punch-audit/factories/make-get-drift-ranking-use-case';

const QuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Math.min(parseInt(v, 10), 100) : 5)),
  minDriftSec: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 30)),
});

export async function v1GetDriftRankingController(app: FastifyInstance) {
  app.get(
    '/v1/hr/punch/audit/drift-ranking',
    {
      schema: {
        tags: ['HR / Punch Audit'],
        summary: 'Get device clock drift ranking',
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'string' },
            minDriftSec: { type: 'string' },
          },
        },
      },
      preHandler: [
        verifyJwt,
        verifyTenant,
        createPermissionMiddleware({
          permission: 'hr.punch.audit.access',
        }),
      ],
    },
    async (request, reply) => {
      const parsed = QuerySchema.parse(request.query);

      const useCase = makeGetDriftRankingUseCase();

      const result = await useCase.execute({
        tenantId: request.user.tenantId,
        limit: parsed.limit,
        minDriftSec: parsed.minDriftSec,
      });

      reply.send({ items: result });
    },
  );
}
