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
import { makeGetOrderByCodeUseCase } from '@/use-cases/sales/orders/factories/make-get-order-by-code-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1GetOrderByCodeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/orders/by-code/:code',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.ACCESS,
        resource: 'orders',
      }),
    ],
    schema: {
      tags: ['PDV'],
      summary: 'Get an order by its sale code',
      params: z.object({ code: z.string().min(1) }),
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
      const { code: saleCode } = request.params;

      try {
        const useCase = makeGetOrderByCodeUseCase();
        const result = await useCase.execute({
          tenantId,
          saleCode,
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
