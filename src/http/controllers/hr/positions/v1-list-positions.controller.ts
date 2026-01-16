import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import {
  listPositionsQuerySchema,
  positionResponseSchema,
} from '@/http/schemas/hr.schema';
import { positionToDTO } from '@/mappers/hr/position';
import { makeListPositionsUseCase } from '@/use-cases/hr/positions/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const listResponseSchema = z.object({
  positions: z.array(positionResponseSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    perPage: z.number(),
    totalPages: z.number(),
  }),
});

export async function listPositionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/positions',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Positions'],
      summary: 'List positions with pagination',
      description: 'Retrieves a paginated list of positions',
      querystring: listPositionsQuerySchema,
      response: {
        200: listResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const {
        page,
        perPage,
        search,
        departmentId,
        companyId,
        level,
        isActive,
      } = request.query;

      const listPositionsUseCase = makeListPositionsUseCase();
      const result = await listPositionsUseCase.execute({
        page,
        perPage,
        search,
        departmentId,
        companyId,
        level,
        isActive,
      });

      return reply.status(200).send({
        positions: result.positions.map(positionToDTO),
        meta: result.meta,
      });
    },
  });
}
