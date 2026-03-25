import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeSyncProductsToMarketplaceUseCase } from '@/use-cases/sales/marketplaces/factories/make-sync-products-to-marketplace-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1SyncProductsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/marketplace-connections/:connectionId/sync/products',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.MARKETPLACES.SYNC,
        resource: 'marketplace-connections',
      }),
    ],
    schema: {
      tags: ['Sales - Marketplace Integration'],
      summary: 'Sync products to marketplace',
      params: z.object({ connectionId: z.string().uuid() }),
      body: z.object({
        products: z
          .array(
            z.object({
              variantId: z.string().uuid(),
              title: z.string().min(1).max(255),
              description: z.string().min(1),
              price: z.number().positive(),
              currency: z.string().length(3).optional(),
              quantity: z.number().int().min(0),
              categoryId: z.string().min(1),
              images: z.array(z.string().url()),
              sku: z.string().optional(),
              gtin: z.string().optional(),
              attributes: z.record(z.string(), z.string()).optional(),
            }),
          )
          .min(1),
      }),
      response: {
        200: z.object({
          syncedListings: z.array(z.any()),
          failedCount: z.number(),
          errors: z.array(
            z.object({
              variantId: z.string(),
              message: z.string(),
            }),
          ),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { connectionId } = request.params;
      const { products } = request.body;

      try {
        const useCase = makeSyncProductsToMarketplaceUseCase();
        const result = await useCase.execute({
          tenantId,
          connectionId,
          products,
        });

        return reply.status(200).send(result);
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
