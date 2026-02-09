import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { financeCategoryResponseSchema } from '@/http/schemas/finance';
import { makeListFinanceCategoriesUseCase } from '@/use-cases/finance/categories/factories/make-list-finance-categories-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listFinanceCategoriesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/categories',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.CATEGORIES.LIST,
        resource: 'finance-categories',
      }),
    ],
    schema: {
      tags: ['Finance - Categories'],
      summary: 'List finance categories',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ categories: z.array(financeCategoryResponseSchema) }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeListFinanceCategoriesUseCase();
      const result = await useCase.execute({ tenantId });

      return reply.status(200).send(result);
    },
  });
}
