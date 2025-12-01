import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { positionResponseSchema } from '@/http/schemas/hr.schema';
import { positionToDTO } from '@/mappers/hr/position';
import { makeGetPositionByIdUseCase } from '@/use-cases/hr/positions/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid('Invalid position ID format'),
});

export async function getPositionByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/positions/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Positions'],
      summary: 'Get a position by ID',
      description: 'Retrieves a position by its unique identifier',
      params: paramsSchema,
      response: {
        200: z.object({
          position: positionResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params;

      try {
        const getPositionByIdUseCase = makeGetPositionByIdUseCase();
        const { position } = await getPositionByIdUseCase.execute({ id });

        return reply.status(200).send({ position: positionToDTO(position) });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Position not found') {
            return reply.status(404).send({ message: error.message });
          }
        }
        throw error;
      }
    },
  });
}
