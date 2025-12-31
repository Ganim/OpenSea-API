import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
    salesOrderResponseSchema,
    updateSalesOrderStatusSchema,
} from '@/http/schemas/sales.schema';
import { makeUpdateSalesOrderStatusUseCase } from '@/use-cases/sales/sales-orders/factories/make-update-sales-order-status-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1UpdateSalesOrderStatusController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/sales-orders/:id/status',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.ORDERS.MANAGE,
        resource: 'sales-orders',
      }),
    ],
    schema: {
      tags: ['Sales - Orders'],
      summary: 'Update sales order status',
      params: z.object({ id: z.string().uuid() }),
      body: updateSalesOrderStatusSchema,
      response: {
        200: z.object({ salesOrder: salesOrderResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const useCase = makeUpdateSalesOrderStatusUseCase();
        const { salesOrder } = await useCase.execute({ id, ...request.body });
        return reply.status(200).send({ salesOrder });
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
