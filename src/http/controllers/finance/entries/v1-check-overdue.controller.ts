import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCheckOverdueEntriesUseCase } from '@/use-cases/finance/entries/factories/make-check-overdue-entries-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function checkOverdueController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/check-overdue',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.MANAGE,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Entries'],
      summary: 'Check and mark overdue entries, create notifications',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({
          markedOverdue: z.number(),
          payableOverdue: z.number(),
          receivableOverdue: z.number(),
          dueSoonAlerts: z.number(),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      const useCase = makeCheckOverdueEntriesUseCase();
      const result = await useCase.execute({
        tenantId,
        createdBy: userId,
      });

      return reply.status(200).send(result);
    },
  });
}
