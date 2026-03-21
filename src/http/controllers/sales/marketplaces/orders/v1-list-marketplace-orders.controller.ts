import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  marketplaceOrderResponseSchema,
  listMarketplaceOrdersQuerySchema,
} from '@/http/schemas/sales/marketplaces';
import { makeListMarketplaceOrdersUseCase } from '@/use-cases/sales/marketplaces/factories/make-list-marketplace-orders-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listMarketplaceOrdersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/marketplaces/connections/:connectionId/orders',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_ORDERS.ACCESS,
        resource: 'marketplace-orders',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplaces'],
      summary: 'List orders from a marketplace connection',
      params: z.object({
        connectionId: z.string().uuid().describe('Connection UUID'),
      }),
      querystring: listMarketplaceOrdersQuerySchema,
      response: {
        200: z.object({
          orders: z.array(marketplaceOrderResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { connectionId } = request.params;
      const query = request.query;

      const useCase = makeListMarketplaceOrdersUseCase();
      const { orders, total, totalPages } = await useCase.execute({
        tenantId,
        connectionId,
        page: query.page,
        limit: query.limit,
        search: query.search,
        status: query.status,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      return reply.status(200).send({
        orders,
        meta: {
          total,
          page: query.page,
          limit: query.limit,
          pages: totalPages,
        },
      });
    },
  });
}
