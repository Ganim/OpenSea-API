import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createScheduleEntrySchema,
  scheduleEntryResponseSchema,
} from '@/http/schemas/production';
import { scheduleEntryToDTO } from '@/mappers/production/schedule-entry-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateScheduleEntryUseCase } from '@/use-cases/production/schedules/factories/make-create-schedule-entry-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createScheduleEntryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/schedules/:scheduleId/entries',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.PLANNING.REGISTER,
        resource: 'production-schedule-entries',
      }),
    ],
    schema: {
      tags: ['Production - Planning'],
      summary: 'Create a new schedule entry (Gantt item)',
      params: z.object({
        scheduleId: z.string(),
      }),
      body: createScheduleEntrySchema,
      response: {
        201: z.object({
          entry: scheduleEntryResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { scheduleId } = request.params;
      const {
        productionOrderId,
        workstationId,
        title,
        startDate,
        endDate,
        color,
        notes,
      } = request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const createScheduleEntryUseCase = makeCreateScheduleEntryUseCase();
      const { entry } = await createScheduleEntryUseCase.execute({
        scheduleId,
        productionOrderId,
        workstationId,
        title,
        startDate,
        endDate,
        color,
        notes,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.SCHEDULE_UPDATE,
        entityId: entry.entryId.toString(),
        placeholders: { userName, name: title },
        newData: { scheduleId, title, startDate, endDate },
      });

      return reply.status(201).send({ entry: scheduleEntryToDTO(entry) });
    },
  });
}
