import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { orderReturnResponseSchema } from '@/http/schemas/sales/orders/order.schema';
import { orderReturnToDTO } from '@/mappers/sales/order-return/order-return-to-dto';
import { makeApproveReturnUseCase } from '@/use-cases/sales/order-returns/factories/make-approve-return-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1ApproveReturnController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/returns/:id/approve',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.ORDERS.ADMIN,
        resource: 'returns',
      }),
    ],
    schema: {
      tags: ['Order Returns'],
      summary: 'Approve a return request',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ orderReturn: orderReturnResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id } = request.params;

      try {
        const useCase = makeApproveReturnUseCase();
        const result = await useCase.execute({
          returnId: id,
          tenantId,
          userId,
        });

        return reply.send({
          orderReturn: orderReturnToDTO(result.orderReturn),
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
