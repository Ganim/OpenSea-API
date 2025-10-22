import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { makeListItemsUseCase } from '@/use-cases/stock/items/factories/make-list-items-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listItemsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/items',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Items'],
      summary: 'List all items',
      querystring: z.object({
        variantId: z.string().uuid().optional(),
        locationId: z.string().uuid().optional(),
        status: z.string().optional(),
      }),
      response: {
        200: z.object({
          items: z.array(
            z.object({
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
          ),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { variantId, locationId, status } = request.query;

      const listItemsUseCase = makeListItemsUseCase();
      const { items } = await listItemsUseCase.execute({
        variantId,
        locationId,
        status,
      });

      return reply.status(200).send({ items });
    },
  });
}
