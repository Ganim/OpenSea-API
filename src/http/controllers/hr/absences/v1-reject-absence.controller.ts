import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { absenceResponseSchema, rejectAbsenceSchema } from '@/http/schemas';
import { idSchema } from '@/http/schemas/common.schema';
import { absenceToDTO } from '@/mappers/hr/absence/absence-to-dto';
import { makeRejectAbsenceUseCase } from '@/use-cases/hr/absences/factories/make-reject-absence-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function rejectAbsenceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/absences/:absenceId/reject',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['HR - Absences'],
      summary: 'Reject absence',
      description: 'Rejects a pending absence request with a reason',
      params: z.object({
        absenceId: idSchema,
      }),
      body: rejectAbsenceSchema,
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
      const { reason } = request.body;
      const userId = request.user.sub;

      try {
        const rejectAbsenceUseCase = makeRejectAbsenceUseCase();
        const { absence } = await rejectAbsenceUseCase.execute({
          absenceId,
          rejectedBy: userId,
          reason,
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
