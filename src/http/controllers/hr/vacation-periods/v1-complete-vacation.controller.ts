import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  completeVacationSchema,
  vacationPeriodResponseSchema,
  idSchema,
} from '@/http/schemas';
import { vacationPeriodToDTO } from '@/mappers/hr/vacation-period/vacation-period-to-dto';
import { makeCompleteVacationUseCase } from '@/use-cases/hr/vacation-periods/factories/make-complete-vacation-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CompleteVacationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/vacation-periods/:vacationPeriodId/complete',
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
      summary: 'Complete vacation',
      description: 'Completes a vacation period after the employee returns',
      params: z.object({
        vacationPeriodId: idSchema,
      }),
      body: completeVacationSchema,
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
      const { vacationPeriodId } = request.params;
      const { daysUsed } = request.body;

      try {
        const completeVacationUseCase = makeCompleteVacationUseCase();
        const { vacationPeriod } = await completeVacationUseCase.execute({
          tenantId,
          vacationPeriodId,
          daysUsed,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.VACATION_COMPLETE,
          entityId: vacationPeriodId,
          placeholders: { employeeName: vacationPeriod.employeeId.toString() },
        });

        return reply
          .status(200)
          .send({ vacationPeriod: vacationPeriodToDTO(vacationPeriod) });
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
