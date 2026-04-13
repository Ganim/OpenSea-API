import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateScheduleEntrySchema,
  scheduleEntryResponseSchema,
} from '@/http/schemas/production';
import { scheduleEntryToDTO } from '@/mappers/production/schedule-entry-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeUpdateScheduleEntryUseCase } from '@/use-cases/production/schedules/factories/make-update-schedule-entry-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateScheduleEntryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/production/schedules/:scheduleId/entries/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.PLANNING.MODIFY,
        resource: 'production-schedule-entries',
      }),
    ],
    schema: {
      tags: ['Production - Planning'],
      summary: 'Update a schedule entry (move/resize in Gantt)',
      params: z.object({
        scheduleId: z.string(),
        id: z.string(),
      }),
      body: updateScheduleEntrySchema,
      response: {
        200: z.object({
          entry: scheduleEntryResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { id } = request.params;
      const { title, startDate, endDate, workstationId, status, color, notes } =
        request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const updateScheduleEntryUseCase = makeUpdateScheduleEntryUseCase();
      const { entry } = await updateScheduleEntryUseCase.execute({
        id,
        title,
        startDate,
        endDate,
        workstationId,
        status,
        color,
        notes,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.SCHEDULE_UPDATE,
        entityId: entry.entryId.toString(),
        placeholders: { userName, name: entry.title },
        newData: { title, startDate, endDate, status },
      });

      return reply.status(200).send({ entry: scheduleEntryToDTO(entry) });
    },
  });
}
