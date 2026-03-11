import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { cacheKeys } from '@/config/redis';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createWorkScheduleSchema,
  workScheduleResponseSchema,
} from '@/http/schemas';
import { workScheduleToDTO } from '@/mappers/hr/work-schedule/work-schedule-to-dto';
import { getCacheService } from '@/services/cache/cache-service';
import { makeCreateWorkScheduleUseCase } from '@/use-cases/hr/work-schedules/factories/make-create-work-schedule-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createWorkScheduleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/work-schedules',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.WORK_SCHEDULES.CREATE,
        resource: 'work-schedules',
      }),
    ],
    schema: {
      tags: ['HR - Work Schedules'],
      summary: 'Create a work schedule',
      description: 'Creates a new work schedule template',
      body: createWorkScheduleSchema,
      response: {
        201: z.object({
          workSchedule: workScheduleResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const createWorkScheduleUseCase = makeCreateWorkScheduleUseCase();
        const { workSchedule } = await createWorkScheduleUseCase.execute({
          ...data,
          tenantId,
        });

        await getCacheService().delPattern(
          `${cacheKeys.hrWorkSchedules(tenantId)}:*`,
        );

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.WORK_SCHEDULE_CREATE,
          entityId: workSchedule.id.toString(),
          placeholders: {
            userName: request.user.sub,
            scheduleName: workSchedule.name,
          },
          newData: data as Record<string, unknown>,
        });

        return reply
          .status(201)
          .send({ workSchedule: workScheduleToDTO(workSchedule) });
      } catch (error) {
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
