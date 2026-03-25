import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { budgetVsActualQuerySchema } from '@/http/schemas/finance/budgets/budget.schema';
import { makeGetBudgetVsActualUseCase } from '@/use-cases/finance/budgets/factories/make-get-budget-vs-actual';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function budgetVsActualController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/reports/budget-vs-actual',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ACCESS,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Reports'],
      summary: 'Get budget vs actual comparison for a given month',
      security: [{ bearerAuth: [] }],
      querystring: budgetVsActualQuerySchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeGetBudgetVsActualUseCase();
      const result = await useCase.execute({
        tenantId,
        year: request.query.year,
        month: request.query.month,
        costCenterId: request.query.costCenterId,
      });

      return reply.send(result);
    },
  });
}
