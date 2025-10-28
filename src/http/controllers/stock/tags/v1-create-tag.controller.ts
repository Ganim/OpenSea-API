import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import {
    createTagSchema,
    tagResponseSchema,
} from '@/http/schemas/stock.schema';
import { makeCreateTagUseCase } from '@/use-cases/stock/tags/factories/make-create-tag-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createTagController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/api/v1/stock/tags',
    schema: {
      tags: ['Stock - Tags'],
      summary: 'Create a new tag',
      body: createTagSchema,
      response: {
        201: z.object({
          tag: tagResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const createTag = makeCreateTagUseCase();

      try {
        const { tag } = await createTag.execute(request.body);

        return reply.status(201).send({ tag });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
