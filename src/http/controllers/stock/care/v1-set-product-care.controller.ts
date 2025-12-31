import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  careOptionResponseSchema,
  setProductCareInstructionsSchema,
} from '@/http/schemas/stock.schema';
import { getCareCatalogProvider } from '@/services/care';
import { makeSetProductCareInstructionsUseCase } from '@/use-cases/stock/products/factories/make-set-product-care-instructions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function setProductCareController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/products/:productId/care',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.PRODUCTS.UPDATE,
        resource: 'products',
      }),
    ],
    schema: {
      tags: ['Stock - Products'],
      summary: 'Set care instructions for a product',
      description:
        'Updates the care instruction labels for a specific product. Accepts an array of care instruction IDs from the catalog.',
      params: z.object({
        productId: z.string().uuid(),
      }),
      body: setProductCareInstructionsSchema,
      response: {
        200: z.object({
          careInstructionIds: z.array(z.string()),
          careInstructions: z.array(careOptionResponseSchema),
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
      const { productId } = request.params;
      const { careInstructionIds } = request.body;

      try {
        const setProductCareInstructions =
          makeSetProductCareInstructionsUseCase();

        const { product } = await setProductCareInstructions.execute({
          productId,
          careInstructionIds,
        });

        // Get full care instruction details for response
        const careCatalogProvider = getCareCatalogProvider();
        const careInstructions = careCatalogProvider.getOptionsByIds(
          product.careInstructionIds,
        );

        return reply.status(200).send({
          careInstructionIds: product.careInstructionIds,
          careInstructions,
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
