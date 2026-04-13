import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { scheduleResponseSchema } from '@/http/schemas/production';
import { scheduleToDTO } from '@/mappers/production/schedule-to-dto';
import { makeListSchedulesUseCase } from '@/use-cases/production/schedules/factories/make-list-schedules-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listSchedulesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/production/schedules',
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
      summary: 'List production schedules',
      response: {
        200: z.object({
          schedules: z.array(scheduleResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const listSchedulesUseCase = makeListSchedulesUseCase();
      const { schedules } = await listSchedulesUseCase.execute({ tenantId });

      return reply.status(200).send({
        schedules: schedules.map(scheduleToDTO),
      });
    },
  });
}
