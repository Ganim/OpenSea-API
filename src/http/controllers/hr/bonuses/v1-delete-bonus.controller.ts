import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { idSchema } from '@/http/schemas';
import { makeDeleteBonusUseCase } from '@/use-cases/hr/bonuses/factories/make-delete-bonus-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteBonusController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/bonuses/:bonusId',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['HR - Bonus'],
      summary: 'Delete a bonus',
      description: 'Soft deletes a bonus',
      params: z.object({
        bonusId: idSchema,
      }),
      response: {
        204: z.null(),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { bonusId } = request.params;

      try {
        const deleteBonusUseCase = makeDeleteBonusUseCase();
        await deleteBonusUseCase.execute({ bonusId });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (
          error instanceof Error &&
          error.message.toLowerCase().includes('not found')
        ) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
