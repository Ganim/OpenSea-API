import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeAcknowledgeMarketplaceOrderUseCase } from '@/use-cases/sales/marketplace-orders/factories/make-acknowledge-marketplace-order-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1AcknowledgeOrderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/marketplace-orders/:id/acknowledge',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_ORDERS.MODIFY,
        resource: 'marketplace-orders',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplace Orders'],
      summary: 'Acknowledge a marketplace order',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ order: z.any() }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      try {
        const useCase = makeAcknowledgeMarketplaceOrderUseCase();
        const result = await useCase.execute({ tenantId, id });
        return reply.status(200).send(result);
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
