import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { listingResponseSchema } from '@/http/schemas/sales/marketplaces';
import { makeDeactivateMarketplaceListingUseCase } from '@/use-cases/sales/marketplaces/factories/make-deactivate-marketplace-listing-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deactivateListingController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/marketplaces/listings/:id/deactivate',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_LISTINGS.MODIFY,
        resource: 'marketplace-listings',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplaces'],
      summary: 'Deactivate a marketplace listing',
      params: z.object({
        id: z.string().uuid().describe('Listing UUID'),
      }),
      response: {
        200: z.object({
          listing: listingResponseSchema,
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

      const useCase = makeDeactivateMarketplaceListingUseCase();
      const { listing } = await useCase.execute({ id, tenantId });

      return reply.status(200).send({ listing });
    },
  });
}
