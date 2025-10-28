import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeDeleteTemplateUseCase } from '@/use-cases/stock/templates/factories/make-delete-template-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/api/v1/stock/templates/:id',
    schema: {
      tags: ['Stock - Templates'],
      summary: 'Delete a template',
      params: z.object({
        id: z.uuid(),
      }),
      response: {
        204: z.null().describe('Template deleted successfully'),
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const deleteTemplate = makeDeleteTemplateUseCase();
      const { id } = request.params as { id: string };

      try {
        await deleteTemplate.execute({ id });

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
