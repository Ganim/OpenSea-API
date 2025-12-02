import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { overtimeResponseSchema } from '@/http/schemas';
import { idSchema } from '@/http/schemas/common.schema';
import { overtimeToDTO } from '@/mappers/hr/overtime/overtime-to-dto';
import { makeGetOvertimeUseCase } from '@/use-cases/hr/overtime/factories/make-get-overtime-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getOvertimeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/overtime/:overtimeId',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Overtime'],
      summary: 'Get overtime by ID',
      description: 'Retrieves an overtime request by ID',
      params: z.object({
        overtimeId: idSchema,
      }),
      response: {
        200: z.object({
          overtime: overtimeResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { overtimeId } = request.params;

      try {
        const getOvertimeUseCase = makeGetOvertimeUseCase();
        const { overtime } = await getOvertimeUseCase.execute({
          id: overtimeId,
        });

        return reply.status(200).send({ overtime: overtimeToDTO(overtime) });
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
