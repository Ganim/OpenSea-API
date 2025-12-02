import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { bonusResponseSchema, createBonusSchema } from '@/http/schemas';
import { bonusToDTO } from '@/mappers/hr/bonus';
import { makeCreateBonusUseCase } from '@/use-cases/hr/bonuses/factories/make-create-bonus-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createBonusController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/bonuses',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['HR - Bonus'],
      summary: 'Create bonus',
      description: 'Creates a new bonus for an employee',
      body: createBonusSchema,
      response: {
        201: z.object({
          bonus: bonusResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const data = request.body;

      try {
        const createBonusUseCase = makeCreateBonusUseCase();
        const { bonus } = await createBonusUseCase.execute(data);

        return reply.status(201).send({ bonus: bonusToDTO(bonus) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
