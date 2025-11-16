import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import {
  templateResponseSchema,
  updateTemplateSchema,
} from '@/http/schemas/stock.schema';
import { makeUpdateTemplateUseCase } from '@/use-cases/stock/templates/factories/make-update-template-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateTemplateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/templates/:id',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Stock - Templates'],
      summary: 'Update a template',
      params: z.object({
        id: z.uuid(),
      }),
      body: updateTemplateSchema,
      response: {
        200: z.object({
          template: templateResponseSchema,
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
      const updateTemplate = makeUpdateTemplateUseCase();
      const { id } = request.params as { id: string };

      try {
        const { template } = await updateTemplate.execute({
          id,
          ...request.body,
        });

        return reply.status(200).send({ template });
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
