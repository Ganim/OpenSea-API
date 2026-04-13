import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { productionOrderStatusCountSchema } from '@/http/schemas/production';
import { makeCountProductionOrdersByStatusUseCase } from '@/use-cases/production/production-orders/factories/make-count-production-orders-by-status-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function countProductionOrdersByStatusController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/orders/count-by-status',
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
      summary: 'Count production orders grouped by status',
      response: {
        200: z.object({
          counts: productionOrderStatusCountSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const countByStatusUseCase = makeCountProductionOrdersByStatusUseCase();
      const { counts } = await countByStatusUseCase.execute({ tenantId });

      return reply.status(200).send({ counts });
    },
  });
}
