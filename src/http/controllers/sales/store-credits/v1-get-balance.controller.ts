import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { storeCreditBalanceResponseSchema } from '@/http/schemas/sales/orders/order.schema';
import { makeGetBalanceUseCase } from '@/use-cases/sales/store-credits/factories/make-get-balance-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1GetStoreCreditBalanceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/store-credits/balance',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.STORE_CREDITS.ACCESS,
        resource: 'store-credits',
      }),
    ],
    schema: {
      tags: ['Store Credits'],
      summary: 'Get store credit balance for a customer',
      querystring: z.object({
        customerId: z.string().uuid(),
      }),
      response: {
        200: storeCreditBalanceResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { customerId } = request.query;

      const useCase = makeGetBalanceUseCase();
      const result = await useCase.execute({ customerId, tenantId });

      return reply.send({ balance: result.balance });
    },
  });
}
