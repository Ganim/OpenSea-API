import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetScheduleByIdUseCase } from '@/use-cases/production/schedules/factories/make-get-schedule-by-id-use-case';
import { makeDeleteScheduleUseCase } from '@/use-cases/production/schedules/factories/make-delete-schedule-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteScheduleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/production/schedules/:scheduleId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.PLANNING.ADMIN,
        resource: 'schedules',
      }),
    ],
    schema: {
      tags: ['Production - Planning'],
      summary: 'Delete a production schedule',
      params: z.object({
        scheduleId: z.string(),
      }),
      response: {
        204: z.null(),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { scheduleId } = request.params;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const getScheduleByIdUseCase = makeGetScheduleByIdUseCase();
      const { schedule } = await getScheduleByIdUseCase.execute({
        scheduleId,
        tenantId,
      });

      const deleteScheduleUseCase = makeDeleteScheduleUseCase();
      await deleteScheduleUseCase.execute({ scheduleId, tenantId });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.SCHEDULE_UPDATE,
        entityId: scheduleId,
        placeholders: { userName, name: schedule.name },
        oldData: { name: schedule.name },
      });

      return reply.status(204).send();
    },
  });
}
