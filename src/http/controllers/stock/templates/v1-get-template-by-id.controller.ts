import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { templateResponseSchema } from '@/http/schemas/stock.schema';
import { makeGetTemplateByIdUseCase } from '@/use-cases/stock/templates/factories/make-get-template-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getTemplateByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/templates/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Stock - Templates'],
      summary: 'Get a template by ID',
      params: z.object({
        id: z.uuid(),
      }),
      response: {
        200: z.object({
          template: templateResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const getTemplateById = makeGetTemplateByIdUseCase();
      const { id } = request.params as { id: string };

      try {
        const { template } = await getTemplateById.execute({ id });

        return reply.status(200).send({ template });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}

