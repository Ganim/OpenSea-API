import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
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
import { makeUpdateOrderItemQuantityUseCase } from '@/use-cases/sales/orders/factories/make-update-order-item-quantity-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1UpdateOrderItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/orders/:id/items/:itemId',
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
      summary: 'Update the quantity of an order item',
      params: z.object({
        id: z.string().uuid(),
        itemId: z.string().uuid(),
      }),
      body: z.object({
        quantity: z.number().positive(),
      }),
      response: {
        200: z.object({
          order: orderResponseSchema,
          orderItem: orderItemResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id: orderId, itemId } = request.params;
      const { quantity } = request.body;

      try {
        const useCase = makeUpdateOrderItemQuantityUseCase();
        const result = await useCase.execute({
          tenantId,
          orderId,
          itemId,
          quantity,
        });

        return reply.send({
          order: orderToDTO(result.order),
          orderItem: orderItemToDTO(result.orderItem),
        });
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
