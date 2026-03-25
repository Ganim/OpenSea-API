import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  budgetIdParamSchema,
  updateBudgetSchema,
} from '@/http/schemas/finance/budgets/budget.schema';
import { makeUpdateBudgetUseCase } from '@/use-cases/finance/budgets/factories/make-update-budget';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function updateBudgetController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/finance/budgets/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BUDGETS.MODIFY,
        resource: 'budgets',
      }),
    ],
    schema: {
      tags: ['Finance - Budgets'],
      summary: 'Update a budget amount',
      security: [{ bearerAuth: [] }],
      params: budgetIdParamSchema,
      body: updateBudgetSchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      const useCase = makeUpdateBudgetUseCase();
      const result = await useCase.execute({
        id: request.params.id,
        tenantId,
        ...request.body,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.FINANCE.BUDGET_UPDATE,
        entityId: result.budget.id,
        placeholders: {
          userName: userId,
          categoryName: result.budget.categoryId,
          month: String(result.budget.month),
          year: String(result.budget.year),
        },
        newData: request.body,
      });

      return reply.send(result.budget);
    },
  });
}
