import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { orderResponseSchema } from '@/http/schemas/sales/orders/order.schema';
import { orderToDTO } from '@/mappers/sales/order/order-to-dto';
import { makeGetMyDraftsUseCase } from '@/use-cases/sales/orders/factories/make-get-my-drafts-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1GetMyDraftsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/orders/my-drafts',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.SELL,
        resource: 'orders',
      }),
    ],
    schema: {
      tags: ['PDV'],
      summary: 'Get my draft PDV orders',
      querystring: z.object({
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
      const userId = request.user.sub;
      const { page, limit } = request.query;

      const useCase = makeGetMyDraftsUseCase();
      const result = await useCase.execute({
        tenantId,
        userId,
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
