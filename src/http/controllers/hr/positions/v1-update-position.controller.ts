import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import {
  positionResponseSchema,
  updatePositionSchema,
} from '@/http/schemas/hr.schema';
import { positionToDTO } from '@/mappers/hr/position';
import { makeUpdatePositionUseCase } from '@/use-cases/hr/positions/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid('Invalid position ID format'),
});

export async function updatePositionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/positions/:id',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['HR - Positions'],
      summary: 'Update a position',
      description: 'Updates an existing position record',
      params: paramsSchema,
      body: updatePositionSchema,
      response: {
        200: z.object({
          position: positionResponseSchema,
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
      const { id } = request.params;
      const {
        name,
        code,
        description,
        departmentId,
        level,
        minSalary,
        maxSalary,
        isActive,
      } = request.body;

      try {
        const updatePositionUseCase = makeUpdatePositionUseCase();
        const { position } = await updatePositionUseCase.execute({
          id,
          name,
          code,
          description,
          departmentId,
          level,
          minSalary,
          maxSalary,
          isActive,
        });

        return reply.status(200).send({ position: positionToDTO(position) });
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message === 'Position not found' ||
            error.message === 'Department not found'
          ) {
            return reply.status(404).send({ message: error.message });
          }
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
