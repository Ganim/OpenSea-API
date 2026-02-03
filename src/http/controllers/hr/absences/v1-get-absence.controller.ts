import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { absenceResponseSchema } from '@/http/schemas';
import { idSchema } from '@/http/schemas/common.schema';
import { absenceToDTO } from '@/mappers/hr/absence/absence-to-dto';
import { makeGetAbsenceUseCase } from '@/use-cases/hr/absences/factories/make-get-absence-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getAbsenceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/absences/:absenceId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Absences'],
      summary: 'Get absence',
      description: 'Retrieves an absence by its ID',
      params: z.object({
        absenceId: idSchema,
      }),
      response: {
        200: z.object({
          absence: absenceResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { absenceId } = request.params;

      try {
        const getAbsenceUseCase = makeGetAbsenceUseCase();
        const { absence } = await getAbsenceUseCase.execute({
          tenantId,
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
        throw error;
      }
    },
  });
}
