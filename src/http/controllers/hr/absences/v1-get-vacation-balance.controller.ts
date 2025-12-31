import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { vacationBalanceResponseSchema } from '@/http/schemas';
import { idSchema } from '@/http/schemas/common.schema';
import { makeCalculateVacationBalanceUseCase } from '@/use-cases/hr/absences/factories/make-calculate-vacation-balance-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getVacationBalanceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/employees/:employeeId/vacation-balance',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Absences'],
      summary: 'Get vacation balance',
      description:
        'Retrieves the vacation balance for an employee including all vacation periods',
      params: z.object({
        employeeId: idSchema,
      }),
      response: {
        200: vacationBalanceResponseSchema,
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { employeeId } = request.params;

      try {
        const calculateVacationBalanceUseCase =
          makeCalculateVacationBalanceUseCase();
        const result = await calculateVacationBalanceUseCase.execute({
          employeeId,
        });

        return reply.status(200).send(result);
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
