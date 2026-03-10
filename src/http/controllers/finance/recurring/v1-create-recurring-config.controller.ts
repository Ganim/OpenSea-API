import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createRecurringConfigSchema,
} from '@/http/schemas/finance/recurring/recurring-config.schema';
import { makeCreateRecurringConfigUseCase } from '@/use-cases/finance/recurring/factories/make-create-recurring-config';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function createRecurringConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/recurring',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.RECURRING.CREATE,
        resource: 'recurring',
      }),
    ],
    schema: {
      tags: ['Finance - Recurring'],
      summary: 'Create a recurring config',
      security: [{ bearerAuth: [] }],
      body: createRecurringConfigSchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      const useCase = makeCreateRecurringConfigUseCase();
      const result = await useCase.execute({
        tenantId,
        ...request.body,
        createdBy: userId,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.FINANCE.RECURRING_CREATE,
        entityId: result.config.id,
        placeholders: { userName: request.user.name ?? '', configName: result.config.description ?? result.config.id },
        newData: request.body,
      });

      return reply.status(201).send(result.config);
    },
  });
}
