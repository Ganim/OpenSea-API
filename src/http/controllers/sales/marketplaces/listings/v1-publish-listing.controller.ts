import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listingResponseSchema,
  publishListingSchema,
} from '@/http/schemas/sales/marketplaces';
import { makePublishMarketplaceListingUseCase } from '@/use-cases/sales/marketplaces/factories/make-publish-marketplace-listing-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function publishListingController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/marketplaces/connections/:connectionId/listings',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_LISTINGS.REGISTER,
        resource: 'marketplace-listings',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplaces'],
      summary: 'Publish a listing to a marketplace',
      params: z.object({
        connectionId: z.string().uuid().describe('Connection UUID'),
      }),
      body: publishListingSchema,
      response: {
        201: z.object({
          listing: listingResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { connectionId } = request.params;
      const body = request.body;

      const useCase = makePublishMarketplaceListingUseCase();
      const { listing } = await useCase.execute({
        tenantId,
        connectionId,
        ...body,
      });

      return reply.status(201).send({ listing });
    },
  });
}
