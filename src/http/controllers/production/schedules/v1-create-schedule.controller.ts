import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createScheduleSchema,
  scheduleResponseSchema,
} from '@/http/schemas/production';
import { scheduleToDTO } from '@/mappers/production/schedule-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateScheduleUseCase } from '@/use-cases/production/schedules/factories/make-create-schedule-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createScheduleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/schedules',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.PLANNING.REGISTER,
        resource: 'schedules',
      }),
    ],
    schema: {
      tags: ['Production - Planning'],
      summary: 'Create a new production schedule',
      body: createScheduleSchema,
      response: {
        201: z.object({
          schedule: scheduleResponseSchema,
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { name, description, startDate, endDate } = request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const createScheduleUseCase = makeCreateScheduleUseCase();
      const { schedule } = await createScheduleUseCase.execute({
        tenantId,
        name,
        description,
        startDate,
        endDate,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.SCHEDULE_CREATE,
        entityId: schedule.scheduleId.toString(),
        placeholders: { userName, name },
        newData: { name, description, startDate, endDate },
      });

      return reply.status(201).send({ schedule: scheduleToDTO(schedule) });
    },
  });
}
