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
import { makeAddOrderItemUseCase } from '@/use-cases/sales/orders/factories/make-add-order-item-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1AddOrderItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/orders/:id/add-item',
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
      summary: 'Add an item to a PDV order',
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        variantId: z.string().uuid(),
        quantity: z.number().positive().optional(),
        isCashier: z.boolean().optional(),
      }),
      response: {
        201: z.object({
          order: orderResponseSchema,
          orderItem: orderItemResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id: orderId } = request.params;
      const { variantId, quantity, isCashier } = request.body;

      try {
        const useCase = makeAddOrderItemUseCase();
        const result = await useCase.execute({
          tenantId,
          orderId,
          variantId,
          quantity,
          isCashier,
        });

        return reply.status(201).send({
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
