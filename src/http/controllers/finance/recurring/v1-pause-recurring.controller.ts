import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { recurringConfigIdParamSchema } from '@/http/schemas/finance/recurring/recurring-config.schema';
import { makePauseRecurringUseCase } from '@/use-cases/finance/recurring/factories/make-pause-recurring';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function pauseRecurringController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/finance/recurring/:id/pause',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.RECURRING.ADMIN,
        resource: 'recurring',
      }),
    ],
    schema: {
      tags: ['Finance - Recurring'],
      summary: 'Pause a recurring config',
      security: [{ bearerAuth: [] }],
      params: recurringConfigIdParamSchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };

      const useCase = makePauseRecurringUseCase();
      const result = await useCase.execute({ id, tenantId });

      await logAudit(request, {
        message: AUDIT_MESSAGES.FINANCE.RECURRING_PAUSE,
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
