import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { listBudgetsQuerySchema } from '@/http/schemas/finance/budgets/budget.schema';
import { makeListBudgetsUseCase } from '@/use-cases/finance/budgets/factories/make-list-budgets';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function listBudgetsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/budgets',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.BUDGETS.ACCESS,
        resource: 'budgets',
      }),
    ],
    schema: {
      tags: ['Finance - Budgets'],
      summary: 'List budgets with optional filters',
      security: [{ bearerAuth: [] }],
      querystring: listBudgetsQuerySchema,
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeListBudgetsUseCase();
      const result = await useCase.execute({
        tenantId,
        ...request.query,
      });

      return reply.send({
        data: result.budgets,
        meta: {
          total: result.total,
          page: request.query.page,
          limit: request.query.limit,
          pages: Math.ceil(result.total / request.query.limit),
        },
      });
    },
  });
}
