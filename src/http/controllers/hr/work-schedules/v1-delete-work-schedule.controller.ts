import { idSchema } from '@/http/schemas';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { cacheKeys } from '@/config/redis';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { getCacheService } from '@/services/cache/cache-service';
import { makeDeleteWorkScheduleUseCase } from '@/use-cases/hr/work-schedules/factories/make-delete-work-schedule-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteWorkScheduleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/work-schedules/:workScheduleId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.WORK_SCHEDULES.DELETE,
        resource: 'work-schedules',
      }),
    ],
    schema: {
      tags: ['HR - Work Schedules'],
      summary: 'Delete a work schedule',
      description: 'Soft deletes a work schedule',
      params: z.object({
        workScheduleId: idSchema,
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
      const tenantId = request.user.tenantId!;
      const { workScheduleId } = request.params;

      try {
        const deleteWorkScheduleUseCase = makeDeleteWorkScheduleUseCase();
        await deleteWorkScheduleUseCase.execute({
          tenantId,
          id: workScheduleId,
        });

        await getCacheService().delPattern(
          `${cacheKeys.hrWorkSchedules(tenantId)}:*`,
        );

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.WORK_SCHEDULE_DELETE,
          entityId: workScheduleId,
          placeholders: {
            userName: request.user.sub,
            scheduleName: workScheduleId,
          },
        });

        return reply.status(204).send(null);
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
        throw error;
      }
    },
  });
}
