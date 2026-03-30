import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listObjectivesQuerySchema,
  objectiveResponseSchema,
} from '@/http/schemas/hr/okrs';
import { objectiveToDTO } from '@/mappers/hr/objective';
import { makeListObjectivesUseCase } from '@/use-cases/hr/okrs/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListObjectivesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/okrs/objectives',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - OKRs'],
      summary: 'List objectives',
      description: 'Lists all OKR objectives with optional filters',
      querystring: listObjectivesQuerySchema,
      response: {
        200: z.object({
          objectives: z.array(objectiveResponseSchema),
          total: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const filters = request.query;

      const useCase = makeListObjectivesUseCase();
      const { objectives, total } = await useCase.execute({
        tenantId,
        ...filters,
      });

      return reply.status(200).send({
        objectives: objectives.map(objectiveToDTO),
        total,
      });
    },
  });
}
