import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { productionCostSummarySchema } from '@/http/schemas/production';
import { productionCostToDTO } from '@/mappers/production/production-cost-to-dto';
import { makeCalculateOrderCostUseCase } from '@/use-cases/production/production-costs/factories/make-calculate-order-cost-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function calculateOrderCostController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/orders/:orderId/costs/summary',
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
      summary: 'Calculate total cost summary for a production order',
      params: z.object({
        orderId: z.string(),
      }),
      response: {
        200: productionCostSummarySchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { orderId } = request.params;

      const calculateOrderCostUseCase = makeCalculateOrderCostUseCase();
      const { totalPlanned, totalActual, totalVariance, details } =
        await calculateOrderCostUseCase.execute({
          productionOrderId: orderId,
        });

      return reply.status(200).send({
        totalPlanned,
        totalActual,
        totalVariance,
        details: details.map(productionCostToDTO),
      });
    },
  });
}
