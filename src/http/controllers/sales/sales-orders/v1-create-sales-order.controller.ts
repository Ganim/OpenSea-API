import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
    createSalesOrderSchema,
    salesOrderResponseSchema,
} from '@/http/schemas/sales.schema';
import { makeCreateSalesOrderUseCase } from '@/use-cases/sales/sales-orders/factories/make-create-sales-order-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1CreateSalesOrderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales-orders',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.ORDERS.CREATE,
        resource: 'sales-orders',
      }),
    ],
    schema: {
      tags: ['Sales - Orders'],
      summary: 'Create a new sales order',
      body: createSalesOrderSchema,
      response: {
        201: z.object({ salesOrder: salesOrderResponseSchema }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeCreateSalesOrderUseCase();
        const { salesOrder } = await useCase.execute(request.body);
        return reply.status(201).send({ salesOrder });
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
