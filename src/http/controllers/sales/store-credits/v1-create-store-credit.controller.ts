import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createStoreCreditSchema } from '@/http/schemas/sales/orders/order.schema';
import { makeCreateManualCreditUseCase } from '@/use-cases/sales/store-credits/factories/make-create-manual-credit-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1CreateStoreCreditController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/store-credits',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.STORE_CREDITS.REGISTER,
        resource: 'store-credits',
      }),
    ],
    schema: {
      tags: ['Store Credits'],
      summary: 'Create a manual store credit',
      body: createStoreCreditSchema,
      response: {
        201: z.object({
          storeCredit: z.object({
            id: z.string().uuid(),
            customerId: z.string().uuid(),
            amount: z.number(),
            balance: z.number(),
            source: z.string(),
            isActive: z.boolean(),
            createdAt: z.coerce.date(),
          }),
        }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeCreateManualCreditUseCase();
        const result = await useCase.execute({
          tenantId,
          ...request.body,
        });

        return reply.status(201).send({
          storeCredit: {
            id: result.storeCredit.id.toString(),
            customerId: result.storeCredit.customerId.toString(),
            amount: result.storeCredit.amount,
            balance: result.storeCredit.balance,
            source: result.storeCredit.source,
            isActive: result.storeCredit.isActive,
            createdAt: result.storeCredit.createdAt,
          },
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
