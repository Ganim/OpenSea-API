import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { paginationSchema } from '@/http/schemas/common.schema';
import { makeListStoreCreditsUseCase } from '@/use-cases/sales/store-credits/factories/make-list-store-credits-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1ListStoreCreditsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/store-credits',
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
      summary: 'List all store credits',
      querystring: paginationSchema.extend({
        customerId: z.string().uuid().optional(),
      }),
      response: {
        200: z.object({
          storeCredits: z.array(
            z.object({
              id: z.string().uuid(),
              customerId: z.string().uuid(),
              amount: z.number(),
              balance: z.number(),
              source: z.string(),
              sourceId: z.string().nullable(),
              isActive: z.boolean(),
              expiresAt: z.coerce.date().nullable(),
              createdAt: z.coerce.date(),
            }),
          ),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, customerId } = request.query;

      const useCase = makeListStoreCreditsUseCase();
      const { storeCredits, meta } = await useCase.execute({
        tenantId,
        page,
        limit,
        customerId,
      });

      return reply.status(200).send({
        storeCredits: storeCredits.map((sc) => ({
          id: sc.id.toString(),
          customerId: sc.customerId.toString(),
          amount: sc.amount,
          balance: sc.balance,
          source: sc.source,
          sourceId: sc.sourceId ?? null,
          isActive: sc.isActive,
          expiresAt: sc.expiresAt ?? null,
          createdAt: sc.createdAt,
        })),
        meta,
      });
    },
  });
}
