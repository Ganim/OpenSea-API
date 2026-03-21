import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListMarketplaceOrdersUseCase } from '@/use-cases/sales/marketplace-orders/factories/make-list-marketplace-orders-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1ListMarketplaceOrdersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/marketplace-orders',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_ORDERS.ACCESS,
        resource: 'marketplace-orders',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplace Orders'],
      summary: 'List marketplace orders',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        perPage: z.coerce.number().int().positive().max(100).default(20),
        connectionId: z.string().uuid().optional(),
        status: z.enum(['RECEIVED', 'ACKNOWLEDGED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'DISPUTE']).optional(),
      }),
      response: {
        200: z.object({
          orders: z.array(z.any()),
          total: z.number(),
          page: z.number(),
          perPage: z.number(),
          totalPages: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, perPage, connectionId, status } = request.query;
      const useCase = makeListMarketplaceOrdersUseCase();
      const result = await useCase.execute({ tenantId, connectionId, status, page, perPage });
      return reply.status(200).send(result);
    },
  });
}
