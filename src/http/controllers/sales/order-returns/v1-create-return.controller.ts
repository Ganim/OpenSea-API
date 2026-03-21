import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createReturnSchema,
  orderReturnResponseSchema,
} from '@/http/schemas/sales/orders/order.schema';
import { orderReturnToDTO } from '@/mappers/sales/order-return/order-return-to-dto';
import { makeCreateReturnUseCase } from '@/use-cases/sales/order-returns/factories/make-create-return-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1CreateReturnController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/returns',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.ORDERS.MODIFY,
        resource: 'returns',
      }),
    ],
    schema: {
      tags: ['Order Returns'],
      summary: 'Create a return request',
      body: createReturnSchema,
      response: {
        201: z.object({ orderReturn: orderReturnResponseSchema }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;

      try {
        const useCase = makeCreateReturnUseCase();
        const result = await useCase.execute({
          tenantId,
          requestedByUserId: userId,
          ...request.body,
        });

        return reply.status(201).send({
          orderReturn: orderReturnToDTO(result.orderReturn),
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
