import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { productionOrderResponseSchema } from '@/http/schemas/production';
import { productionOrderToDTO } from '@/mappers/production/production-order-to-dto';
import { makeGetProductionOrderByIdUseCase } from '@/use-cases/production/production-orders/factories/make-get-production-order-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getProductionOrderByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/orders/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ORDERS.ACCESS,
        resource: 'production-orders',
      }),
    ],
    schema: {
      tags: ['Production - Orders'],
      summary: 'Get a production order by ID',
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: z.object({
          productionOrder: productionOrderResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const getProductionOrderByIdUseCase = makeGetProductionOrderByIdUseCase();
      const { productionOrder } = await getProductionOrderByIdUseCase.execute({
        tenantId,
        id,
      });

      return reply
        .status(200)
        .send({ productionOrder: productionOrderToDTO(productionOrder) });
    },
  });
}
