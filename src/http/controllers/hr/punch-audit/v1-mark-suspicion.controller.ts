/**
 * Phase 9 / Plan 09-02 — POST /v1/hr/punch/audit/:id/mark-suspicion
 * Mark time entry suspicious. Requires PIN gate.
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyActionPin } from '@/http/middlewares/verify-action-pin';
import { makeMarkSuspicionUseCase } from '@/use-cases/hr/punch-audit/factories/make-mark-suspicion-use-case';

const ParamsSchema = z.object({
  id: z.string().uuid(),
});

const BodySchema = z.object({
  reason: z.string().min(1).max(512),
  pin: z.string().length(6),
});

export async function v1MarkSuspicionController(app: FastifyInstance) {
  app.post<{
    Params: z.infer<typeof ParamsSchema>;
    Body: z.infer<typeof BodySchema>;
  }>(
    '/v1/hr/punch/audit/:id/mark-suspicion',
    {
      schema: {
        tags: ['HR / Punch Audit'],
        summary: 'Mark time entry as suspicious (requires PIN)',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            reason: { type: 'string' },
            pin: { type: 'string' },
          },
          required: ['reason', 'pin'],
        },
      },
      preHandler: [
        verifyJwt,
        verifyTenant,
        createPermissionMiddleware({
          permission: 'hr.punch.audit.admin',
        }),
        verifyActionPin, // PIN verification middleware
      ],
    },
    async (request, reply) => {
      const { id } = ParamsSchema.parse(request.params);
      const { reason } = BodySchema.parse(request.body);

      const useCase = makeMarkSuspicionUseCase();

      const result = await useCase.execute({
        tenantId: request.user.tenantId,
        timeEntryId: id,
        reason,
        markedByUserId: request.user.id,
      });

      reply.code(200).send(result);
    },
  );
}
