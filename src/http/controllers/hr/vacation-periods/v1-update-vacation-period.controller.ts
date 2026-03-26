import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  vacationPeriodResponseSchema,
  updateVacationPeriodSchema,
  idSchema,
} from '@/http/schemas';
import { vacationPeriodToDTO } from '@/mappers/hr/vacation-period';
import { makeUpdateVacationPeriodUseCase } from '@/use-cases/hr/vacation-periods/factories/make-update-vacation-period-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateVacationPeriodController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/vacation-periods/:periodId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.VACATIONS.MODIFY,
        resource: 'vacation-periods',
      }),
    ],
    schema: {
      tags: ['HR - Vacation Periods'],
      summary: 'Update a vacation period',
      description:
        'Updates an existing vacation period (only pending or available periods can be updated)',
      params: z.object({
        periodId: idSchema,
      }),
      body: updateVacationPeriodSchema,
      response: {
        200: z.object({
          vacationPeriod: vacationPeriodResponseSchema,
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
      const { periodId } = request.params;
      const body = request.body;

      try {
        const updateVacationPeriodUseCase = makeUpdateVacationPeriodUseCase();
        const { vacationPeriod } = await updateVacationPeriodUseCase.execute({
          tenantId,
          periodId,
          ...body,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.VACATION_PERIOD_UPDATE,
          entityId: vacationPeriod.id.toString(),
          placeholders: {
            userName: request.user.sub,
            employeeName: vacationPeriod.employeeId.toString(),
          },
          newData: body as Record<string, unknown>,
        });

        return reply
          .status(200)
          .send({ vacationPeriod: vacationPeriodToDTO(vacationPeriod) });
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
