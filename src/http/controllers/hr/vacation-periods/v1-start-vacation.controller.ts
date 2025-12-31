import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { vacationPeriodResponseSchema } from '@/http/schemas';
import { idSchema } from '@/http/schemas/common.schema';
import { vacationPeriodToDTO } from '@/mappers/hr/vacation-period/vacation-period-to-dto';
import { makeStartVacationUseCase } from '@/use-cases/hr/vacation-periods/factories/make-start-vacation-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function startVacationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/vacation-periods/:vacationPeriodId/start',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Vacation Periods'],
      summary: 'Start vacation',
      description: 'Starts a scheduled vacation (employee begins vacation)',
      params: z.object({
        vacationPeriodId: idSchema,
      }),
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

      try {
        const startVacationUseCase = makeStartVacationUseCase();
        const { vacationPeriod } = await startVacationUseCase.execute({
          vacationPeriodId,
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
