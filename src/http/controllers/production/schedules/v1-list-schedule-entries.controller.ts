import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { scheduleEntryResponseSchema } from '@/http/schemas/production';
import { scheduleEntryToDTO } from '@/mappers/production/schedule-entry-to-dto';
import { makeListScheduleEntriesUseCase } from '@/use-cases/production/schedules/factories/make-list-schedule-entries-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listScheduleEntriesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/schedules/:scheduleId/entries',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.PLANNING.ACCESS,
        resource: 'production-schedule-entries',
      }),
    ],
    schema: {
      tags: ['Production - Planning'],
      summary: 'List schedule entries (Gantt data)',
      params: z.object({
        scheduleId: z.string(),
      }),
      querystring: z.object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      }),
      response: {
        200: z.object({
          entries: z.array(scheduleEntryResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { scheduleId } = request.params;
      const { startDate, endDate } = request.query;

      const listScheduleEntriesUseCase = makeListScheduleEntriesUseCase();
      const { entries } = await listScheduleEntriesUseCase.execute({
        scheduleId,
        startDate,
        endDate,
      });

      return reply
        .status(200)
        .send({ entries: entries.map(scheduleEntryToDTO) });
    },
  });
}
