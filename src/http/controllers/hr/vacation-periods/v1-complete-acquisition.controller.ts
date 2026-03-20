import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCompleteAcquisitionUseCase } from '@/use-cases/hr/vacation-periods/factories/make-complete-acquisition-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CompleteAcquisitionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/vacation-periods/:id/complete-acquisition',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.VACATIONS.ADMIN,
        resource: 'vacation-periods',
      }),
    ],
    schema: {
      tags: ['HR - Vacation Periods'],
      summary: 'Complete acquisition period',
      description:
        'Marks a vacation acquisition period as complete (employee worked 12 months)',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({ message: z.string() }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeCompleteAcquisitionUseCase();
        const { vacationPeriod } = await useCase.execute({
          tenantId,
          vacationPeriodId: id,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.VACATION_PERIOD_CREATE,
          entityId: id,
          placeholders: {
            userName: request.user.sub,
            employeeName: vacationPeriod.employeeId.toString(),
          },
          newData: { status: 'AVAILABLE' },
        });

        return reply
          .status(200)
          .send({ message: 'Período aquisitivo concluído com sucesso' });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
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
