import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { overtimeResponseSchema, requestOvertimeSchema } from '@/http/schemas';
import { overtimeToDTO } from '@/mappers/hr/overtime/overtime-to-dto';
import { makeRequestOvertimeUseCase } from '@/use-cases/hr/overtime/factories/make-request-overtime-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function requestOvertimeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/overtime',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Overtime'],
      summary: 'Request overtime',
      description: 'Creates a new overtime request for an employee',
      body: requestOvertimeSchema,
      response: {
        201: z.object({
          overtime: overtimeResponseSchema,
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
      const data = request.body;

      try {
        const requestOvertimeUseCase = makeRequestOvertimeUseCase();
        const { overtime } = await requestOvertimeUseCase.execute(data);

        return reply.status(201).send({ overtime: overtimeToDTO(overtime) });
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
