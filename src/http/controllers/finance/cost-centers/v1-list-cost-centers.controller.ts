import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { costCenterResponseSchema } from '@/http/schemas/finance';
import { makeListCostCentersUseCase } from '@/use-cases/finance/cost-centers/factories/make-list-cost-centers-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listCostCentersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/cost-centers',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.COST_CENTERS.LIST,
        resource: 'cost-centers',
      }),
    ],
    schema: {
      tags: ['Finance - Cost Centers'],
      summary: 'List cost centers',
      security: [{ bearerAuth: [] }],
      response: {
        200: z.object({ costCenters: z.array(costCenterResponseSchema) }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeListCostCentersUseCase();
      const result = await useCase.execute({ tenantId });

      return reply.status(200).send(result);
    },
  });
}
