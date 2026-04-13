import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { scheduleResponseSchema } from '@/http/schemas/production';
import { scheduleToDTO } from '@/mappers/production/schedule-to-dto';
import { makeGetScheduleByIdUseCase } from '@/use-cases/production/schedules/factories/make-get-schedule-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getScheduleByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/schedules/:scheduleId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.PLANNING.ACCESS,
        resource: 'schedules',
      }),
    ],
    schema: {
      tags: ['Production - Planning'],
      summary: 'Get a production schedule by ID',
      params: z.object({
        scheduleId: z.string(),
      }),
      response: {
        200: z.object({
          schedule: scheduleResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { scheduleId } = request.params;

      const getScheduleByIdUseCase = makeGetScheduleByIdUseCase();
      const { schedule } = await getScheduleByIdUseCase.execute({
        scheduleId,
        tenantId,
      });

      return reply.status(200).send({ schedule: scheduleToDTO(schedule) });
    },
  });
}
