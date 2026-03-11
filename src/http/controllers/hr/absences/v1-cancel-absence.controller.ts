import { idSchema, BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema, absenceResponseSchema } from '@/http/schemas';
import { absenceToDTO } from '@/mappers/hr/absence/absence-to-dto';
import { makeCancelAbsenceUseCase } from '@/use-cases/hr/absences/factories/make-cancel-absence-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CancelAbsenceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/absences/:absenceId/cancel',
    preHandler: [verifyJwt, verifyTenant],
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
      const tenantId = request.user.tenantId!;
      const { absenceId } = request.params;

      try {
        const cancelAbsenceUseCase = makeCancelAbsenceUseCase();
        const { absence } = await cancelAbsenceUseCase.execute({
          tenantId,
          absenceId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.ABSENCE_CANCEL,
          entityId: absenceId,
          placeholders: {
            userName: request.user.sub,
            employeeName: absence.employeeId.toString(),
          },
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
