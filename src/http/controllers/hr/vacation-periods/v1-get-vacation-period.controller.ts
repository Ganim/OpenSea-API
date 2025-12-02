import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { vacationPeriodResponseSchema } from '@/http/schemas';
import { idSchema } from '@/http/schemas/common.schema';
import { vacationPeriodToDTO } from '@/mappers/hr/vacation-period/vacation-period-to-dto';
import { makeGetVacationPeriodUseCase } from '@/use-cases/hr/vacation-periods/factories/make-get-vacation-period-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getVacationPeriodController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/vacation-periods/:vacationPeriodId',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Vacation Periods'],
      summary: 'Get vacation period',
      description: 'Retrieves a vacation period by its ID',
      params: z.object({
        vacationPeriodId: idSchema,
      }),
      response: {
        200: z.object({
          vacationPeriod: vacationPeriodResponseSchema,
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
        const getVacationPeriodUseCase = makeGetVacationPeriodUseCase();
        const { vacationPeriod } = await getVacationPeriodUseCase.execute({
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
        throw error;
      }
    },
  });
}
