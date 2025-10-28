import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeDeleteTagUseCase } from '@/use-cases/stock/tags/factories/make-delete-tag-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteTagController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/api/v1/stock/tags/:id',
    schema: {
      tags: ['Stock - Tags'],
      summary: 'Delete a tag',
      params: z.object({
        id: z.uuid(),
      }),
      response: {
        204: z.null().describe('Tag deleted successfully'),
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const deleteTag = makeDeleteTagUseCase();
      const { id } = request.params as { id: string };

      try {
        await deleteTag.execute({ id });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
