import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { processPendingResponseSchema } from '@/http/schemas/sales/cadences/cadence.schema';
import { makeProcessPendingActionsUseCase } from '@/use-cases/sales/cadence-sequences/factories/make-process-pending-actions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function processPendingActionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/cadences/process-pending',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CADENCES.ADMIN,
        resource: 'cadences',
      }),
    ],
    schema: {
      tags: ['Sales - Cadences'],
      summary: 'Process all pending cadence actions',
      response: {
        200: processPendingResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      const useCase = makeProcessPendingActionsUseCase();
      const result = await useCase.execute({ tenantId });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.CADENCE_PROCESS_PENDING,
        entityId: tenantId,
        placeholders: {
          userName: userId,
          processedCount: String(result.processedCount),
        },
      });

      return reply.status(200).send(result);
    },
  });
}
