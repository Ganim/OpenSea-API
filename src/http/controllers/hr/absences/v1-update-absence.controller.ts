import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  absenceResponseSchema,
  updateAbsenceSchema,
  idSchema,
} from '@/http/schemas';
import { absenceToDTO } from '@/mappers/hr/absence';
import { makeUpdateAbsenceUseCase } from '@/use-cases/hr/absences/factories/make-update-absence-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateAbsenceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/absences/:absenceId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ABSENCES.MODIFY,
        resource: 'absences',
      }),
    ],
    schema: {
      tags: ['HR - Absences'],
      summary: 'Update an absence',
      description:
        'Updates an existing absence (only pending absences can be updated)',
      params: z.object({
        absenceId: idSchema,
      }),
      body: updateAbsenceSchema,
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
      const body = request.body;

      try {
        const updateAbsenceUseCase = makeUpdateAbsenceUseCase();
        const { absence } = await updateAbsenceUseCase.execute({
          tenantId,
          absenceId,
          ...body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.ABSENCE_UPDATE,
          entityId: absence.id.toString(),
          placeholders: {
            userName: request.user.sub,
            employeeName: absence.employeeId.toString(),
          },
          newData: body as Record<string, unknown>,
        });

        return reply.status(200).send({ absence: absenceToDTO(absence) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
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
