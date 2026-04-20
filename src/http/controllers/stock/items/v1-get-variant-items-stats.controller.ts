import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetVariantItemsStatsUseCase } from '@/use-cases/stock/items/factories/make-get-variant-items-stats-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getVariantItemsStatsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/items/by-variant/:variantId/stats',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.ITEMS.ACCESS,
        resource: 'items',
      }),
    ],
    schema: {
      tags: ['Stock - Items'],
      summary: 'Get aggregated stats for all items of a variant',
      params: z.object({
        variantId: z.uuid(),
      }),
      response: {
        200: z.object({
          totalItems: z.number(),
          inStockItems: z.number(),
          totalQuantity: z.number(),
          inStockQuantity: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { variantId } = request.params;

      const useCase = makeGetVariantItemsStatsUseCase();
      const result = await useCase.execute({ tenantId, variantId });

      return reply.status(200).send(result);
    },
  });
}
