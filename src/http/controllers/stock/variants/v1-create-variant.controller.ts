import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
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
      body: z.object({
        productId: z.string().uuid(),
        sku: z.string().min(1).max(100),
        name: z.string().min(1).max(255),
        price: z.number().positive(),
        imageUrl: z.string().url().optional(),
        attributes: z.record(z.string(), z.unknown()).optional(),
        costPrice: z.number().positive().optional(),
        profitMargin: z.number().min(0).max(100).optional(),
        barcode: z.string().max(50).optional(),
        qrCode: z.string().max(100).optional(),
        eanCode: z.string().max(13).optional(),
        upcCode: z.string().max(12).optional(),
        minStock: z.number().int().min(0).optional(),
        maxStock: z.number().int().min(0).optional(),
        reorderPoint: z.number().int().min(0).optional(),
        reorderQuantity: z.number().int().min(0).optional(),
      }),
      response: {
        201: z.object({
          variant: z.object({
            id: z.string().uuid(),
            productId: z.string().uuid(),
            sku: z.string(),
            name: z.string(),
            price: z.number(),
            imageUrl: z.string().optional(),
            attributes: z.record(z.string(), z.unknown()),
            costPrice: z.number().optional(),
            profitMargin: z.number().optional(),
            barcode: z.string().optional(),
            qrCode: z.string().optional(),
            eanCode: z.string().optional(),
            upcCode: z.string().optional(),
            minStock: z.number().optional(),
            maxStock: z.number().optional(),
            reorderPoint: z.number().optional(),
            reorderQuantity: z.number().optional(),
          }),
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
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
