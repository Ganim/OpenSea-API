import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  sellVacationDaysSchema,
  vacationPeriodResponseSchema,
} from '@/http/schemas';
import { idSchema } from '@/http/schemas/common.schema';
import { vacationPeriodToDTO } from '@/mappers/hr/vacation-period/vacation-period-to-dto';
import { makeSellVacationDaysUseCase } from '@/use-cases/hr/vacation-periods/factories/make-sell-vacation-days-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function sellVacationDaysController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/vacation-periods/:vacationPeriodId/sell',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Vacation Periods'],
      summary: 'Sell vacation days',
      description:
        'Sells vacation days (abono pecuniário). Maximum 1/3 of total days (10 of 30)',
      params: z.object({
        vacationPeriodId: idSchema,
      }),
      body: sellVacationDaysSchema,
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
      const { daysToSell } = request.body;

      try {
        const sellVacationDaysUseCase = makeSellVacationDaysUseCase();
        const { vacationPeriod } = await sellVacationDaysUseCase.execute({
          vacationPeriodId,
          daysToSell,
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
