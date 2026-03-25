import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeProcessOverdueEscalationsUseCase } from '@/use-cases/finance/escalations/factories/make-process-overdue-escalations-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function processOverdueEscalationsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/escalations/process',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ADMIN,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Escalations'],
      summary: 'Process all overdue entries against escalation rules',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          processed: z.number(),
          actionsCreated: z.number(),
          errors: z.array(z.string()),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      const useCase = makeProcessOverdueEscalationsUseCase();
      const result = await useCase.execute({
        tenantId,
        createdBy: userId,
      });

      return reply.status(200).send(result);
    },
  });
}
