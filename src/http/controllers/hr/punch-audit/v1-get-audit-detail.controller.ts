/**
 * Phase 9 / Plan 09-02 — GET /v1/hr/punch/audit/:id
 * Returns TimeEntry detail + signals + map data.
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { makeGetAuditDetailUseCase } from '@/use-cases/hr/punch-audit/factories/make-get-audit-detail-use-case';

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function v1GetAuditDetailController(app: FastifyInstance) {
  app.get<{ Params: z.infer<typeof ParamsSchema> }>(
    '/v1/hr/punch/audit/:id',
    {
      schema: {
        tags: ['HR / Punch Audit'],
        summary: 'Get audit entry details with signals',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
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
      const { id } = ParamsSchema.parse(request.params);

      const useCase = makeGetAuditDetailUseCase();

      const result = await useCase.execute({
        tenantId: request.user.tenantId,
        rowId: id,
      });

      reply.send(result);
    },
  );
}
