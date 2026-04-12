import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { orderResponseSchema } from '@/http/schemas/sales/orders/order.schema';
import { orderToDTO } from '@/mappers/sales/order/order-to-dto';
import { makeGetCashierQueueUseCase } from '@/use-cases/sales/orders/factories/make-get-cashier-queue-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1GetCashierQueueController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/orders/cashier-queue',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.RECEIVE,
        resource: 'orders',
      }),
    ],
    schema: {
      tags: ['PDV'],
      summary: 'Get the cashier queue of pending orders',
      querystring: z.object({
        terminalId: z.string().uuid(),
        search: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
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
      const { terminalId, search, page, limit } = request.query;

      const useCase = makeGetCashierQueueUseCase();
      const result = await useCase.execute({
        tenantId,
        terminalId,
        search,
        page,
        limit,
      });

      return reply.send({
        data: result.orders.data.map(orderToDTO),
        meta: {
          total: result.orders.total,
          page: result.orders.page,
          limit: result.orders.limit,
          pages: result.orders.totalPages,
        },
      });
    },
  });
}
