import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { productionCostResponseSchema } from '@/http/schemas/production';
import { productionCostToDTO } from '@/mappers/production/production-cost-to-dto';
import { makeListProductionCostsUseCase } from '@/use-cases/production/production-costs/factories/make-list-production-costs-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listProductionCostsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/orders/:orderId/costs',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.COSTING.ACCESS,
        resource: 'production-costs',
      }),
    ],
    schema: {
      tags: ['Production - Costing'],
      summary: 'List all costs for a production order',
      params: z.object({
        orderId: z.string(),
      }),
      response: {
        200: z.object({
          costs: z.array(productionCostResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { orderId } = request.params;

      const listProductionCostsUseCase = makeListProductionCostsUseCase();
      const { costs } = await listProductionCostsUseCase.execute({
        productionOrderId: orderId,
      });

      return reply
        .status(200)
        .send({ costs: costs.map(productionCostToDTO) });
    },
  });
}
