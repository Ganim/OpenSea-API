import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createBudgetSchema } from '@/http/schemas/finance/budgets/budget.schema';
import { makeCreateBudgetUseCase } from '@/use-cases/finance/budgets/factories/make-create-budget';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function createBudgetController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/finance/budgets',
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
      summary: 'Create or update a budget for a category and month',
      security: [{ bearerAuth: [] }],
      body: createBudgetSchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      const useCase = makeCreateBudgetUseCase();
      const result = await useCase.execute({
        tenantId,
        ...request.body,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.FINANCE.BUDGET_CREATE,
        entityId: result.budget.id,
        placeholders: {
          userName: userId,
          categoryName: result.budget.categoryId,
          month: String(result.budget.month),
          year: String(result.budget.year),
        },
        newData: request.body,
      });

      return reply.status(201).send(result.budget);
    },
  });
}
