import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { getTimeBankQuerySchema, timeBankResponseSchema } from '@/http/schemas';
import { idSchema } from '@/http/schemas/common.schema';
import { timeBankToDTO } from '@/mappers/hr/time-bank/time-bank-to-dto';
import { makeGetTimeBankUseCase } from '@/use-cases/hr/time-bank/factories/make-get-time-bank-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getTimeBankController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/time-bank/:employeeId',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Time Bank'],
      summary: 'Get employee time bank',
      description: 'Retrieves the time bank balance for an employee',
      params: z.object({
        employeeId: idSchema,
      }),
      querystring: getTimeBankQuerySchema,
      response: {
        200: z.object({
          timeBank: timeBankResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { employeeId } = request.params;
      const { year } = request.query;

      try {
        const getTimeBankUseCase = makeGetTimeBankUseCase();
        const { timeBank } = await getTimeBankUseCase.execute({
          employeeId,
          year,
        });

        return reply.status(200).send({ timeBank: timeBankToDTO(timeBank) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
