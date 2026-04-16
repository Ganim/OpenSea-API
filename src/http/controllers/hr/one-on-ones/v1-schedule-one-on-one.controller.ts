import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createOneOnOneMeetingBodySchema,
  oneOnOneMeetingResponseSchema,
} from '@/http/schemas/hr/one-on-ones';
import { oneOnOneMeetingToDTO } from '@/mappers/hr/one-on-one-meeting';
import { makeGetMyEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-get-my-employee-use-case';
import { makeScheduleOneOnOneUseCase } from '@/use-cases/hr/one-on-ones/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ScheduleOneOnOneController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/one-on-ones',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ONE_ON_ONES.REGISTER,
        resource: 'one-on-ones',
      }),
    ],
    schema: {
      tags: ['HR - One-on-Ones'],
      summary: 'Agenda uma reunião 1:1',
      description:
        'Cria uma reunião 1:1 entre o gestor logado e um colaborador (report).',
      body: createOneOnOneMeetingBodySchema,
      response: {
        201: z.object({ meeting: oneOnOneMeetingResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { reportId, scheduledAt, durationMinutes } = request.body;
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const getMyEmployeeUseCase = makeGetMyEmployeeUseCase();
        const { employee: managerEmployee } =
          await getMyEmployeeUseCase.execute({ tenantId, userId });

        const scheduleOneOnOneUseCase = makeScheduleOneOnOneUseCase();
        const { meeting } = await scheduleOneOnOneUseCase.execute({
          tenantId,
          managerId: managerEmployee.id.toString(),
          reportId,
          scheduledAt,
          durationMinutes,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.ONE_ON_ONE_SCHEDULE,
          entityId: meeting.id.toString(),
          placeholders: {
            userName: userId,
            reportName: reportId,
            scheduledAt: scheduledAt.toISOString(),
          },
          newData: {
            managerId: managerEmployee.id.toString(),
            reportId,
            scheduledAt: scheduledAt.toISOString(),
            durationMinutes: meeting.durationMinutes,
          },
        });

        return reply.status(201).send({
          meeting: oneOnOneMeetingToDTO(meeting, {
            viewerIsManager: true,
            viewerIsReport: false,
          }),
        });
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
