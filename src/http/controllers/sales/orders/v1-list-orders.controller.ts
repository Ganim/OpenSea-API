import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { orderResponseSchema } from '@/http/schemas/sales/orders/order.schema';
import { orderToDTO } from '@/mappers/sales/order/order-to-dto';
import { makeListOrdersUseCase } from '@/use-cases/sales/orders/factories/make-list-orders-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1ListOrdersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/orders',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.ORDERS.ACCESS,
        resource: 'orders',
      }),
    ],
    schema: {
      tags: ['Orders'],
      summary: 'List orders',
      querystring: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
        type: z.string().optional(),
        channel: z.string().optional(),
        stageId: z.string().uuid().optional(),
        pipelineId: z.string().uuid().optional(),
        customerId: z.string().uuid().optional(),
        assignedToUserId: z.string().uuid().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
      }),
      response: {
        200: z.object({
          data: z.array(orderResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query;

      const useCase = makeListOrdersUseCase();
      const result = await useCase.execute({
        tenantId,
        ...query,
      });

      return reply.send({
        data: result.orders.map(orderToDTO),
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          pages: result.totalPages,
        },
      });
    },
  });
}
