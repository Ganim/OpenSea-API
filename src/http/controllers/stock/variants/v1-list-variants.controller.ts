import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { makeListVariantsUseCase } from '@/use-cases/stock/variants/factories/make-list-variants-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listVariantsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/variants',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Variants'],
      summary: 'List all variants',
      response: {
        200: z.object({
          variants: z.array(
            z.object({
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
          ),
        }),
      },
    },

    handler: async (request, reply) => {
      const listVariantsUseCase = makeListVariantsUseCase();
      const { variants } = await listVariantsUseCase.execute();

      return reply.status(200).send({ variants });
    },
  });
}
