import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { marketplaceOrderResponseSchema } from '@/http/schemas/sales/marketplaces';
import { makeAcknowledgeMarketplaceOrderUseCase } from '@/use-cases/sales/marketplaces/factories/make-acknowledge-marketplace-order-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function acknowledgeOrderController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/marketplaces/orders/:id/acknowledge',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_ORDERS.MODIFY,
        resource: 'marketplace-orders',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplaces'],
      summary: 'Acknowledge a marketplace order',
      params: z.object({
        id: z.string().uuid().describe('Order UUID'),
      }),
      response: {
        200: z.object({
          order: marketplaceOrderResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      const useCase = makeAcknowledgeMarketplaceOrderUseCase();
      const { order } = await useCase.execute({ id, tenantId });

      return reply.status(200).send({ order });
    },
  });
}
