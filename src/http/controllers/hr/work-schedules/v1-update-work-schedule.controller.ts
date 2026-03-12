import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { cacheKeys } from '@/config/redis';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateWorkScheduleSchema,
  workScheduleResponseSchema,
  idSchema,
} from '@/http/schemas';
import { workScheduleToDTO } from '@/mappers/hr/work-schedule/work-schedule-to-dto';
import { getCacheService } from '@/services/cache/cache-service';
import { makeUpdateWorkScheduleUseCase } from '@/use-cases/hr/work-schedules/factories/make-update-work-schedule-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateWorkScheduleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/work-schedules/:workScheduleId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.WORK_SCHEDULES.UPDATE,
        resource: 'work-schedules',
      }),
    ],
    schema: {
      tags: ['HR - Work Schedules'],
      summary: 'Update a work schedule',
      description: 'Updates an existing work schedule',
      params: z.object({
        workScheduleId: idSchema,
      }),
      body: updateWorkScheduleSchema,
      response: {
        200: z.object({
          workSchedule: workScheduleResponseSchema,
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
      const { workScheduleId } = request.params;
      const data = request.body;

      try {
        const updateWorkScheduleUseCase = makeUpdateWorkScheduleUseCase();
        const { workSchedule } = await updateWorkScheduleUseCase.execute({
          tenantId,
          id: workScheduleId,
          ...data,
        });

        await getCacheService().delPattern(
          `${cacheKeys.hrWorkSchedules(tenantId)}:*`,
        );

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.WORK_SCHEDULE_UPDATE,
          entityId: workScheduleId,
          placeholders: {
            userName: request.user.sub,
            scheduleName: workSchedule.name,
          },
          newData: data as Record<string, unknown>,
        });

        return reply
          .status(200)
          .send({ workSchedule: workScheduleToDTO(workSchedule) });
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
