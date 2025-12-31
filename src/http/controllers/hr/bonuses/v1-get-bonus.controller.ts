import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { bonusResponseSchema, idSchema } from '@/http/schemas';
import { bonusToDTO } from '@/mappers/hr/bonus';
import { makeGetBonusUseCase } from '@/use-cases/hr/bonuses/factories/make-get-bonus-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getBonusController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/bonuses/:bonusId',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Bonus'],
      summary: 'Get bonus',
      description: 'Gets a bonus by ID',
      params: z.object({
        bonusId: idSchema,
      }),
      response: {
        200: z.object({
          bonus: bonusResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { bonusId } = request.params;

      try {
        const getBonusUseCase = makeGetBonusUseCase();
        const { bonus } = await getBonusUseCase.execute({ bonusId });

        return reply.status(200).send({ bonus: bonusToDTO(bonus) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (
          error instanceof Error &&
          error.message.toLowerCase().includes('não encontrad')
        ) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
