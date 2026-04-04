import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { orderResponseSchema } from '@/http/schemas/sales/orders/order.schema';
import { orderToDTO } from '@/mappers/sales/order/order-to-dto';
import { makeClaimOrderUseCase } from '@/use-cases/sales/orders/factories/make-claim-order-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1ClaimOrderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/orders/:id/claim',
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
      summary: 'Claim a pending order for cashier processing',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ order: orderResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        409: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id: orderId } = request.params;

      try {
        const useCase = makeClaimOrderUseCase();
        const result = await useCase.execute({
          tenantId,
          orderId,
          userId,
        });

        return reply.send({ order: orderToDTO(result.order) });
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        if (err instanceof ConflictError) {
          return reply.status(409).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
