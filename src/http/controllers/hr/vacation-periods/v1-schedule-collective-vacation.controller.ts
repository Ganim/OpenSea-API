import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeScheduleCollectiveVacationUseCase } from '@/use-cases/hr/vacation-periods/factories/make-schedule-collective-vacation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ScheduleCollectiveVacationController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/vacation-periods/collective',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.VACATIONS.ADMIN,
        resource: 'vacations',
      }),
    ],
    schema: {
      tags: ['HR - Vacation Periods'],
      summary: 'Schedule collective vacation',
      description:
        'Schedules collective vacation (férias coletivas) for multiple employees. ' +
        'Minimum 10 days per period (CLT Art. 139). Maximum 2 periods per year.',
      body: z.object({
        employeeIds: z.array(z.string().uuid()).min(1),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      }),
      response: {
        200: z.object({
          results: z.array(
            z.object({
              employeeId: z.string(),
              employeeName: z.string(),
              success: z.boolean(),
              splitId: z.string().optional(),
              error: z.string().optional(),
            }),
          ),
          totalScheduled: z.number(),
          totalFailed: z.number(),
        }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { employeeIds, startDate, endDate } = request.body;
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeScheduleCollectiveVacationUseCase();
        const result = await useCase.execute({
          tenantId,
          employeeIds,
          startDate,
          endDate,
        });

        return reply.status(200).send(result);
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
