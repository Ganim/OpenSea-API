import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import {
    calculateWorkedHoursSchema,
    workedHoursResponseSchema,
} from '@/http/schemas';
import { makeCalculateWorkedHoursUseCase } from '@/use-cases/hr/time-control/factories/make-calculate-worked-hours-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function calculateWorkedHoursController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/time-control/calculate-hours',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Time Control'],
      summary: 'Calculate worked hours',
      description: 'Calculates worked hours for an employee in a date range',
      body: calculateWorkedHoursSchema,
      response: {
        200: workedHoursResponseSchema,
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const data = request.body;

      try {
        const calculateWorkedHoursUseCase = makeCalculateWorkedHoursUseCase();
        const result = await calculateWorkedHoursUseCase.execute(data);

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
