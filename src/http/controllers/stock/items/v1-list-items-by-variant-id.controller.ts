import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { itemResponseSchema } from '@/http/schemas';
import { makeListItemsByVariantIdUseCase } from '@/use-cases/stock/items/factories/make-list-items-by-variant-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listItemsByVariantIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/items/by-variant/:variantId',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Items'],
      summary: 'List items by variant ID',
      params: z.object({
        variantId: z.uuid(),
      }),
      response: {
        200: z.object({
          items: z.array(itemResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { variantId } = request.params;

      const listItemsByVariantIdUseCase = makeListItemsByVariantIdUseCase();
      const { items } = await listItemsByVariantIdUseCase.execute({
        variantId,
      });

      return reply.status(200).send({ items });
    },
  });
}