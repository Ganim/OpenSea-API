import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteOverdueEscalationUseCase } from '@/use-cases/finance/escalations/factories/make-delete-overdue-escalation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteOverdueEscalationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
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
      summary: 'Soft-delete an overdue escalation template',
      security: [{ bearerAuth: [] }],
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        204: z.null(),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const useCase = makeDeleteOverdueEscalationUseCase();
      await useCase.execute({ id, tenantId });

      return reply.status(204).send(null);
    },
  });
}
