import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListMarketplaceListingsUseCase } from '@/use-cases/sales/marketplace-listings/factories/make-list-marketplace-listings-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1ListListingsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/marketplace-connections/:connectionId/listings',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_LISTINGS.ACCESS,
        resource: 'marketplace-listings',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplace Listings'],
      summary: 'List listings for a connection',
      params: z.object({ connectionId: z.string().uuid() }),
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        perPage: z.coerce.number().int().positive().max(100).default(20),
      }),
      response: {
        200: z.object({
          listings: z.array(z.any()),
          total: z.number(),
          page: z.number(),
          perPage: z.number(),
          totalPages: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { connectionId } = request.params;
      const { page, perPage } = request.query;
      const useCase = makeListMarketplaceListingsUseCase();
      const result = await useCase.execute({ tenantId, connectionId, page, perPage });
      return reply.status(200).send(result);
    },
  });
}
