import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { paginationSchema } from '@/http/schemas';
import { productionOrderResponseSchema } from '@/http/schemas/production';
import { productionOrderToDTO } from '@/mappers/production/production-order-to-dto';
import { makeListProductionOrdersUseCase } from '@/use-cases/production/production-orders/factories/make-list-production-orders-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listProductionOrdersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/orders',
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
      summary: 'List production orders',
      querystring: paginationSchema.extend({
        status: z
          .enum([
            'DRAFT',
            'PLANNED',
            'FIRM',
            'RELEASED',
            'IN_PROCESS',
            'TECHNICALLY_COMPLETE',
            'CLOSED',
            'CANCELLED',
          ])
          .optional(),
        search: z.string().optional(),
      }),
      response: {
        200: z.object({
          productionOrders: z.array(productionOrderResponseSchema),
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
      const { page, limit, status, search } = request.query;

      const listProductionOrdersUseCase = makeListProductionOrdersUseCase();
      const { productionOrders, total } =
        await listProductionOrdersUseCase.execute({
          tenantId,
          page,
          limit,
          status,
          search,
        });

      const pages = Math.ceil(total / limit);

      return reply.status(200).send({
        productionOrders: productionOrders.map(productionOrderToDTO),
        meta: { total, page, limit, pages },
      });
    },
  });
}
