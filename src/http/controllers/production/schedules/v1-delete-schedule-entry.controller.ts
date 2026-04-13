import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteScheduleEntryUseCase } from '@/use-cases/production/schedules/factories/make-delete-schedule-entry-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteScheduleEntryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/production/schedules/:scheduleId/entries/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.PLANNING.ADMIN,
        resource: 'production-schedule-entries',
      }),
    ],
    schema: {
      tags: ['Production - Planning'],
      summary: 'Delete a schedule entry',
      params: z.object({
        scheduleId: z.string(),
        id: z.string(),
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
      const { id } = request.params;

      const deleteScheduleEntryUseCase = makeDeleteScheduleEntryUseCase();
      await deleteScheduleEntryUseCase.execute({ id });

      return reply.status(204).send();
    },
  });
}
