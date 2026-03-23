import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makePublishMarketplaceListingUseCase } from '@/use-cases/sales/marketplace-listings/factories/make-publish-marketplace-listing-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1PublishListingController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/marketplace-connections/:connectionId/listings',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACE_LISTINGS.REGISTER,
        resource: 'marketplace-listings',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplace Listings'],
      summary: 'Publish a listing to a marketplace',
      params: z.object({ connectionId: z.string().uuid() }),
      body: z.object({
        variantId: z.string().uuid(),
        externalListingId: z.string().min(1),
        externalProductId: z.string().optional(),
        externalUrl: z.string().url().optional(),
        publishedPrice: z.number().positive().optional(),
        compareAtPrice: z.number().positive().optional(),
        publishedStock: z.number().int().min(0).optional(),
        externalCategoryId: z.string().optional(),
        externalCategoryPath: z.string().optional(),
      }),
      response: {
        201: z.object({ listing: z.any() }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { connectionId } = request.params;
      const data = request.body;
      try {
        const useCase = makePublishMarketplaceListingUseCase();
        const result = await useCase.execute({
          tenantId,
          connectionId,
          ...data,
        });
        return reply.status(201).send(result);
      } catch (err) {
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
