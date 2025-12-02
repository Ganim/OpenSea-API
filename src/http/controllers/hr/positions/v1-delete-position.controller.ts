import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import { makeDeletePositionUseCase } from '@/use-cases/hr/positions/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid('Invalid position ID format'),
});

const responseSchema = z.object({
  message: z.string(),
});

export async function deletePositionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/positions/:id',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['HR - Positions'],
      summary: 'Delete a position',
      description: 'Deletes a position from the system',
      params: paramsSchema,
      response: {
        200: responseSchema,
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
      const { id } = request.params;

      try {
        const deletePositionUseCase = makeDeletePositionUseCase();
        await deletePositionUseCase.execute({ id });

        return reply.status(200).send({
          message: 'Position deleted successfully',
        });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Position not found') {
            return reply.status(404).send({ message: error.message });
          }
          if (error.message === 'Cannot delete position with employees') {
            return reply.status(400).send({ message: error.message });
          }
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
