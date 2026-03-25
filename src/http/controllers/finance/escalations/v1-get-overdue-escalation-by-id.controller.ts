import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetOverdueEscalationByIdUseCase } from '@/use-cases/finance/escalations/factories/make-get-overdue-escalation-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getOverdueEscalationByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/escalations/:id',
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
      summary: 'Get overdue escalation template by ID with steps',
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          escalation: z.any(),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const useCase = makeGetOverdueEscalationByIdUseCase();
      const result = await useCase.execute({ id, tenantId });

      return reply.status(200).send(result);
    },
  });
}
