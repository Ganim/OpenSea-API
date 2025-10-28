import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { createVariantSchema, variantResponseSchema } from '@/http/schemas';
import { makeCreateVariantUseCase } from '@/use-cases/stock/variants/factories/make-create-variant-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createVariantController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/variants',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Variants'],
      summary: 'Create a new variant',
      body: createVariantSchema,
      response: {
        201: z.object({
          variant: variantResponseSchema,
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
      const {
        productId,
        sku,
        name,
        price,
        imageUrl,
        attributes,
        costPrice,
        profitMargin,
        barcode,
        qrCode,
        eanCode,
        upcCode,
        minStock,
        maxStock,
        reorderPoint,
        reorderQuantity,
      } = request.body;

      try {
        const createVariantUseCase = makeCreateVariantUseCase();
        const { variant } = await createVariantUseCase.execute({
          productId,
          sku,
          name,
          price,
          imageUrl,
          attributes,
          costPrice,
          profitMargin,
          barcode,
          qrCode,
          eanCode,
          upcCode,
          minStock,
          maxStock,
          reorderPoint,
          reorderQuantity,
        });

        return reply.status(201).send({ variant });
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
