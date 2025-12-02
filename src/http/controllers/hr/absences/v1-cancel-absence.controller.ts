import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { absenceResponseSchema } from '@/http/schemas';
import { idSchema } from '@/http/schemas/common.schema';
import { absenceToDTO } from '@/mappers/hr/absence/absence-to-dto';
import { makeCancelAbsenceUseCase } from '@/use-cases/hr/absences/factories/make-cancel-absence-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function cancelAbsenceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/absences/:absenceId/cancel',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Absences'],
      summary: 'Cancel absence',
      description: 'Cancels an absence request',
      params: z.object({
        absenceId: idSchema,
      }),
      response: {
        200: z.object({
          absence: absenceResponseSchema,
        }),
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
      const { absenceId } = request.params;

      try {
        const cancelAbsenceUseCase = makeCancelAbsenceUseCase();
        const { absence } = await cancelAbsenceUseCase.execute({
          absenceId,
        });

        return reply.status(200).send({ absence: absenceToDTO(absence) });
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
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
