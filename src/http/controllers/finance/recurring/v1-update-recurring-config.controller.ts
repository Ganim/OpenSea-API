import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  recurringConfigIdParamSchema,
  updateRecurringConfigSchema,
} from '@/http/schemas/finance/recurring/recurring-config.schema';
import { makeUpdateRecurringConfigUseCase } from '@/use-cases/finance/recurring/factories/make-update-recurring-config';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function updateRecurringConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/finance/recurring/:id',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.RECURRING.UPDATE,
        resource: 'recurring',
      }),
    ],
    schema: {
      tags: ['Finance - Recurring'],
      summary: 'Update a recurring config',
      security: [{ bearerAuth: [] }],
      params: recurringConfigIdParamSchema,
      body: updateRecurringConfigSchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };

      const useCase = makeUpdateRecurringConfigUseCase();
      const result = await useCase.execute({
        id,
        tenantId,
        ...request.body,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.FINANCE.RECURRING_UPDATE,
        entityId: id,
        placeholders: {
          userName: request.user.sub,
          configName: result.config.description ?? id,
        },
        newData: request.body,
      });

      return reply.status(200).send(result.config);
    },
  });
}
