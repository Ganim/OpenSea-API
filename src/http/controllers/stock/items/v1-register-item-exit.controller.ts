import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { itemExitResponseSchema, registerItemExitSchema } from '@/http/schemas';
import { makeRegisterItemExitUseCase } from '@/use-cases/stock/items/factories/make-register-item-exit-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function registerItemExitController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/items/exit',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['Items'],
      summary: 'Register item exit',
      body: registerItemExitSchema,
      response: {
        200: itemExitResponseSchema,
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
        const registerItemExitUseCase = makeRegisterItemExitUseCase();
        const result = await registerItemExitUseCase.execute({
          ...data,
          userId,
        });

        return reply.status(200).send(result);
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
