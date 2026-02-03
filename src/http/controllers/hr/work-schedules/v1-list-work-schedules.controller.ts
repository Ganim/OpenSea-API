import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listWorkSchedulesQuerySchema,
  workScheduleResponseSchema,
} from '@/http/schemas';
import { workScheduleToDTO } from '@/mappers/hr/work-schedule/work-schedule-to-dto';
import { makeListWorkSchedulesUseCase } from '@/use-cases/hr/work-schedules/factories/make-list-work-schedules-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listWorkSchedulesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/work-schedules',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Work Schedules'],
      summary: 'List work schedules',
      description: 'Lists all work schedules with optional filters',
      querystring: listWorkSchedulesQuerySchema,
      response: {
        200: z.object({
          workSchedules: z.array(workScheduleResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query;

      const listWorkSchedulesUseCase = makeListWorkSchedulesUseCase();
      const { workSchedules } = await listWorkSchedulesUseCase.execute({
        tenantId,
        activeOnly: query.activeOnly,
      });

      return reply.status(200).send({
        workSchedules: workSchedules.map(workScheduleToDTO),
      });
    },
  });
}
