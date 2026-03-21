import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { orderReturnResponseSchema } from '@/http/schemas/sales/orders/order.schema';
import { orderReturnToDTO } from '@/mappers/sales/order-return/order-return-to-dto';
import { makeListReturnsUseCase } from '@/use-cases/sales/order-returns/factories/make-list-returns-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1ListReturnsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/returns',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.ORDERS.ACCESS,
        resource: 'returns',
      }),
    ],
    schema: {
      tags: ['Order Returns'],
      summary: 'List order returns',
      querystring: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
        status: z.string().optional(),
        orderId: z.string().uuid().optional(),
      }),
      response: {
        200: z.object({
          data: z.array(orderReturnResponseSchema),
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

      const useCase = makeListReturnsUseCase();
      const result = await useCase.execute({
        tenantId,
        ...request.query,
      });

      return reply.send({
        data: result.returns.map(orderReturnToDTO),
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
