import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { updateVariantSchema, variantResponseSchema } from '@/http/schemas';
import { makeUpdateVariantUseCase } from '@/use-cases/stock/variants/factories/make-update-variant-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateVariantController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/variants/:id',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Variants'],
      summary: 'Update a variant',
      params: z.object({
        id: z.uuid(),
      }),
      body: updateVariantSchema,
      response: {
        200: z.object({
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
      const { id } = request.params;
      const {
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
        const updateVariantUseCase = makeUpdateVariantUseCase();
        const { variant } = await updateVariantUseCase.execute({
          id,
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

        return reply.status(200).send({ variant });
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
