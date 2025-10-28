import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import {
  createTemplateSchema,
  templateResponseSchema,
} from '@/http/schemas/stock.schema';
import { makeCreateTemplateUseCase } from '@/use-cases/stock/templates/factories/make-create-template-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/v1/stock/templates',
    schema: {
      tags: ['Stock - Templates'],
      summary: 'Create a new template',
      body: createTemplateSchema,
      response: {
        201: z.object({
          template: templateResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const createTemplate = makeCreateTemplateUseCase();

      try {
        const { template } = await createTemplate.execute(request.body);

        return reply.status(201).send({ template });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
