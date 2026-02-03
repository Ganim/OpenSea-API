import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { positionWithDetailsResponseSchema } from '@/http/schemas/hr.schema';
import { positionToDetailsDTO } from '@/mappers/hr/position';
import { makeGetPositionByIdUseCase } from '@/use-cases/hr/positions/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid('Invalid position ID format'),
});

const querySchema = z.object({
  includeEmployees: z.coerce.boolean().optional().default(false),
});

export async function getPositionByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/positions/:id',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Positions'],
      summary: 'Get a position by ID',
      description:
        'Retrieves a position by its unique identifier with department, company and employee count',
      params: paramsSchema,
      querystring: querySchema,
      response: {
        200: z.object({
          position: positionWithDetailsResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const { includeEmployees } = request.query;

      try {
        const getPositionByIdUseCase = makeGetPositionByIdUseCase();
        const result = await getPositionByIdUseCase.execute({
          tenantId,
          id,
          includeEmployees,
        });

        return reply.status(200).send({
          position: positionToDetailsDTO(result),
        });
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
