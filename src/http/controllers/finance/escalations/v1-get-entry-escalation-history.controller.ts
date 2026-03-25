import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetEntryEscalationHistoryUseCase } from '@/use-cases/finance/escalations/factories/make-get-entry-escalation-history-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getEntryEscalationHistoryController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/entries/:id/escalation-history',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ACCESS,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Escalations'],
      summary: 'List all escalation actions for a finance entry',
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          actions: z.array(z.any()),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const useCase = makeGetEntryEscalationHistoryUseCase();
      const result = await useCase.execute({
        entryId: id,
        tenantId,
      });

      return reply.status(200).send(result);
    },
  });
}
