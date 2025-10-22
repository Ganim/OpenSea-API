import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { makeGetItemByIdUseCase } from '@/use-cases/stock/items/factories/make-get-item-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getItemByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/items/:itemId',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Items'],
      summary: 'Get item by ID',
      params: z.object({
        itemId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          item: z.object({
            id: z.string(),
            uniqueCode: z.string(),
            variantId: z.string(),
            locationId: z.string(),
            initialQuantity: z.number(),
            currentQuantity: z.number(),
            status: z.string(),
            entryDate: z.date(),
            attributes: z.record(z.string(), z.unknown()),
            batchNumber: z.string().nullable(),
            manufacturingDate: z.date().nullable(),
            expiryDate: z.date().nullable(),
            createdAt: z.date(),
            updatedAt: z.date(),
          }),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { itemId } = request.params;

      try {
        const getItemByIdUseCase = makeGetItemByIdUseCase();
        const { item } = await getItemByIdUseCase.execute({
          id: itemId,
        });

        return reply.status(200).send({ item });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
