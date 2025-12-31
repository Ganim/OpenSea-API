import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { clockInOutSchema, timeEntryResponseSchema } from '@/http/schemas';
import { timeEntryToDTO } from '@/mappers/hr/time-entry/time-entry-to-dto';
import { makeClockOutUseCase } from '@/use-cases/hr/time-control/factories/make-clock-out-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function clockOutController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/time-control/clock-out',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Time Control'],
      summary: 'Register clock out',
      description: 'Registers a clock-out entry for an employee',
      body: clockInOutSchema,
      response: {
        201: z.object({
          timeEntry: timeEntryResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const data = request.body;

      try {
        const clockOutUseCase = makeClockOutUseCase();
        const { timeEntry } = await clockOutUseCase.execute(data);

        return reply.status(201).send({ timeEntry: timeEntryToDTO(timeEntry) });
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
