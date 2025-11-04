import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import {
  tagResponseSchema,
  updateTagSchema,
} from '@/http/schemas/stock.schema';
import { makeUpdateTagUseCase } from '@/use-cases/stock/tags/factories/make-update-tag-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateTagController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/tags/:id',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Stock - Tags'],
      summary: 'Update a tag',
      params: z.object({
        id: z.uuid(),
      }),
      body: updateTagSchema,
      response: {
        200: z.object({
          tag: tagResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
    },
    handler: async (request, reply) => {
      const updateTag = makeUpdateTagUseCase();
      const { id } = request.params as { id: string };

      try {
        const { tag } = await updateTag.execute({
          id,
          ...request.body,
        });

        return reply.status(200).send({ tag });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
