import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetStoreCreditByIdUseCase } from '@/use-cases/sales/store-credits/factories/make-get-store-credit-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1GetStoreCreditByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/store-credits/:storeCreditId',
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
      summary: 'Get a store credit by ID',
      params: z.object({
        storeCreditId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          storeCredit: z.object({
            id: z.string().uuid(),
            customerId: z.string().uuid(),
            amount: z.number(),
            balance: z.number(),
            source: z.string(),
            sourceId: z.string().nullable(),
            reservedForOrderId: z.string().uuid().nullable(),
            isActive: z.boolean(),
            expiresAt: z.coerce.date().nullable(),
            createdAt: z.coerce.date(),
            updatedAt: z.coerce.date().nullable(),
          }),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { storeCreditId } = request.params;

      try {
        const useCase = makeGetStoreCreditByIdUseCase();
        const { storeCredit } = await useCase.execute({
          tenantId,
          storeCreditId,
        });

        return reply.status(200).send({
          storeCredit: {
            id: storeCredit.id.toString(),
            customerId: storeCredit.customerId.toString(),
            amount: storeCredit.amount,
            balance: storeCredit.balance,
            source: storeCredit.source,
            sourceId: storeCredit.sourceId ?? null,
            reservedForOrderId:
              storeCredit.reservedForOrderId?.toString() ?? null,
            isActive: storeCredit.isActive,
            expiresAt: storeCredit.expiresAt ?? null,
            createdAt: storeCredit.createdAt,
            updatedAt: storeCredit.updatedAt ?? null,
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
