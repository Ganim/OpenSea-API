import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  scheduleVacationSchema,
  vacationPeriodResponseSchema,
} from '@/http/schemas';
import { idSchema } from '@/http/schemas/common.schema';
import { vacationPeriodToDTO } from '@/mappers/hr/vacation-period/vacation-period-to-dto';
import { makeScheduleVacationUseCase } from '@/use-cases/hr/vacation-periods/factories/make-schedule-vacation-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function scheduleVacationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/vacation-periods/:vacationPeriodId/schedule',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Vacation Periods'],
      summary: 'Schedule vacation',
      description: 'Schedules vacation for a specific vacation period',
      params: z.object({
        vacationPeriodId: idSchema,
      }),
      body: scheduleVacationSchema,
      response: {
        200: z.object({
          vacationPeriod: vacationPeriodResponseSchema,
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
      const { vacationPeriodId } = request.params;
      const { startDate, endDate, days } = request.body;

      try {
        const scheduleVacationUseCase = makeScheduleVacationUseCase();
        const { vacationPeriod } = await scheduleVacationUseCase.execute({
          vacationPeriodId,
          startDate,
          endDate,
          days,
        });

        return reply
          .status(200)
          .send({ vacationPeriod: vacationPeriodToDTO(vacationPeriod) });
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
