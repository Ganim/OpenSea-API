import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { recurringConfigIdParamSchema } from '@/http/schemas/finance/recurring/recurring-config.schema';
import { makeCancelRecurringUseCase } from '@/use-cases/finance/recurring/factories/make-cancel-recurring';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function cancelRecurringController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/finance/recurring/:id/cancel',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.RECURRING.MANAGE,
        resource: 'recurring',
      }),
    ],
    schema: {
      tags: ['Finance - Recurring'],
      summary: 'Cancel a recurring config',
      security: [{ bearerAuth: [] }],
      params: recurringConfigIdParamSchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };

      const useCase = makeCancelRecurringUseCase();
      const result = await useCase.execute({ id, tenantId });

      await logAudit(request, {
        message: AUDIT_MESSAGES.FINANCE.RECURRING_CANCEL,
        entityId: id,
        placeholders: {
          userName: request.user.sub,
          configName: result.config.description ?? id,
        },
      });

      return reply.status(200).send(result.config);
    },
  });
}
