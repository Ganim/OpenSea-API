import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import {
  itemEntryResponseSchema,
  registerItemEntrySchema,
} from '@/http/schemas';
import { makeRegisterItemEntryUseCase } from '@/use-cases/stock/items/factories/make-register-item-entry-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function registerItemEntryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/items/entry',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Items'],
      summary: 'Register item entry',
      body: registerItemEntrySchema,
      response: {
        201: itemEntryResponseSchema,
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const data = request.body;

      try {
        const registerItemEntryUseCase = makeRegisterItemEntryUseCase();
        const result = await registerItemEntryUseCase.execute({
          ...data,
          userId,
        });

        return reply.status(201).send(result);
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
