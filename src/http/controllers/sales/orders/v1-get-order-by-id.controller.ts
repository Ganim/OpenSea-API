import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  orderResponseSchema,
  orderItemResponseSchema,
} from '@/http/schemas/sales/orders/order.schema';
import { orderToDTO } from '@/mappers/sales/order/order-to-dto';
import { orderItemToDTO } from '@/mappers/sales/order-item/order-item-to-dto';
import { makeGetOrderByIdUseCase } from '@/use-cases/sales/orders/factories/make-get-order-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1GetOrderByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/orders/:id',
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
      summary: 'Get order by ID',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
          order: orderResponseSchema,
          items: z.array(orderItemResponseSchema),
        }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const useCase = makeGetOrderByIdUseCase();
        const result = await useCase.execute({
          orderId: id,
          tenantId,
        });

        return reply.send({
          order: orderToDTO(result.order),
          items: result.items.map(orderItemToDTO),
        });
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
