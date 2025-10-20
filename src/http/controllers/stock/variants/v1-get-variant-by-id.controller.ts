import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { makeGetVariantByIdUseCase } from '@/use-cases/stock/variants/factories/make-get-variant-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getVariantByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/variants/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Variants'],
      summary: 'Get variant by ID',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
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
            createdAt: z.coerce.date(),
            updatedAt: z.coerce.date().optional(),
          }),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },

    handler: async (request, reply) => {
      const { id } = request.params;

      try {
        const getVariantByIdUseCase = makeGetVariantByIdUseCase();
        const { variant } = await getVariantByIdUseCase.execute({ id });

        return reply.status(200).send({ variant });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
