import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { budgetIdParamSchema } from '@/http/schemas/finance/budgets/budget.schema';
import { makeDeleteBudgetUseCase } from '@/use-cases/finance/budgets/factories/make-delete-budget';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function deleteBudgetController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/finance/budgets/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BUDGETS.REMOVE,
        resource: 'budgets',
      }),
    ],
    schema: {
      tags: ['Finance - Budgets'],
      summary: 'Delete a budget',
      security: [{ bearerAuth: [] }],
      params: budgetIdParamSchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      const useCase = makeDeleteBudgetUseCase();
      await useCase.execute({
        id: request.params.id,
        tenantId,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.FINANCE.BUDGET_DELETE,
        entityId: request.params.id,
        placeholders: {
          userName: userId,
          categoryName: 'N/A',
          month: 'N/A',
          year: 'N/A',
        },
      });

      return reply.status(204).send();
    },
  });
}
