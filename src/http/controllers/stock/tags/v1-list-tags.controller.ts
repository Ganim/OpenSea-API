import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { tagResponseSchema } from '@/http/schemas/stock.schema';
import { makeListTagsUseCase } from '@/use-cases/stock/tags/factories/make-list-tags-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listTagsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/tags',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Stock - Tags'],
      summary: 'List all tags',
      response: {
        200: z.object({
          tags: z.array(tagResponseSchema),
        }),
      },
    },
    handler: async (request, reply) => {
      const listTags = makeListTagsUseCase();

      const { tags } = await listTags.execute();

      return reply.status(200).send({ tags });
    },
  });
}
