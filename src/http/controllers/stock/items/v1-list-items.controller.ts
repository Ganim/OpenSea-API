import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { itemResponseSchema } from '@/http/schemas';
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
        variantId: z.uuid().optional(),
        locationId: z.uuid().optional(),
        productId: z.uuid().optional(),
        status: z.string().optional(),
      }),
      response: {
        200: z.object({
          items: z.array(itemResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { variantId, locationId, productId, status } = request.query;

      const listItemsUseCase = makeListItemsUseCase();
      const { items } = await listItemsUseCase.execute({
        variantId,
        locationId,
        productId,
        status,
      });

      return reply.status(200).send({ items });
    },
  });
}
