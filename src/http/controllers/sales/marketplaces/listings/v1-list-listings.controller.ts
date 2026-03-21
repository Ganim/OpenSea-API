import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listingResponseSchema,
  listListingsQuerySchema,
} from '@/http/schemas/sales/marketplaces';
import { makeListMarketplaceListingsUseCase } from '@/use-cases/sales/marketplaces/factories/make-list-marketplace-listings-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listListingsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/marketplaces/connections/:connectionId/listings',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_LISTINGS.ACCESS,
        resource: 'marketplace-listings',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplaces'],
      summary: 'List listings for a marketplace connection',
      params: z.object({
        connectionId: z.string().uuid().describe('Connection UUID'),
      }),
      querystring: listListingsQuerySchema,
      response: {
        200: z.object({
          listings: z.array(listingResponseSchema),
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
      const { connectionId } = request.params;
      const query = request.query;

      const useCase = makeListMarketplaceListingsUseCase();
      const { listings, total, totalPages } = await useCase.execute({
        tenantId,
        connectionId,
        page: query.page,
        limit: query.limit,
        search: query.search,
        status: query.status,
        variantId: query.variantId,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      return reply.status(200).send({
        listings,
        meta: {
          total,
          page: query.page,
          limit: query.limit,
          pages: totalPages,
        },
      });
    },
  });
}
