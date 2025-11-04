import { verifyJwt } from '@/http/middlewares/verify-jwt';
import {
  salesOrderResponseSchema,
  salesOrderStatusEnum,
} from '@/http/schemas/sales.schema';
import { makeListSalesOrdersUseCase } from '@/use-cases/sales/sales-orders/factories/make-list-sales-orders-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1ListSalesOrdersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales-orders',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Sales Orders'],
      summary: 'List sales orders',
      querystring: z.object({
        page: z.coerce.number().min(1).default(1),
        perPage: z.coerce.number().min(1).max(100).default(20),
        customerId: z.string().uuid().optional(),
        status: salesOrderStatusEnum.optional(),
      }),
      response: {
        200: z.object({
          salesOrders: z.array(salesOrderResponseSchema),
          total: z.number(),
          page: z.number(),
          perPage: z.number(),
          totalPages: z.number(),
        }),
      },
    },
    handler: async (request, reply) => {
      const { page, perPage, customerId, status } = request.query;
      const useCase = makeListSalesOrdersUseCase();
      const result = await useCase.execute({
        page,
        perPage,
        customerId,
        status,
      });
      return reply.status(200).send(result);
    },
  });
}
