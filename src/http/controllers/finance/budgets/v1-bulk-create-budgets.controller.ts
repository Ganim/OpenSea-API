import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { bulkCreateBudgetsSchema } from '@/http/schemas/finance/budgets/budget.schema';
import { makeBulkCreateBudgetsUseCase } from '@/use-cases/finance/budgets/factories/make-bulk-create-budgets';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function bulkCreateBudgetsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/budgets/bulk',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BUDGETS.REGISTER,
        resource: 'budgets',
      }),
    ],
    schema: {
      tags: ['Finance - Budgets'],
      summary: 'Set budgets for multiple months at once',
      security: [{ bearerAuth: [] }],
      body: bulkCreateBudgetsSchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      const useCase = makeBulkCreateBudgetsUseCase();
      const result = await useCase.execute({
        tenantId,
        ...request.body,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.FINANCE.BUDGET_BULK_CREATE,
        entityId: request.body.categoryId,
        placeholders: {
          userName: userId,
          count: String(result.createdCount),
          year: String(request.body.year),
        },
        newData: request.body,
      });

      return reply.status(201).send({
        budgets: result.budgets,
        createdCount: result.createdCount,
      });
    },
  });
}
