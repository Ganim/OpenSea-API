import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  safetyProgramResponseSchema,
  listSafetyProgramsQuerySchema,
} from '@/http/schemas';
import { safetyProgramToDTO } from '@/mappers/hr/safety-program';
import { makeListSafetyProgramsUseCase } from '@/use-cases/hr/safety-programs/factories/make-list-safety-programs-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListSafetyProgramsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/safety-programs',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Safety Programs'],
      summary: 'List safety programs',
      description: 'Lists all safety programs with optional filters',
      querystring: listSafetyProgramsQuerySchema,
      response: {
        200: z.object({
          safetyPrograms: z.array(safetyProgramResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const filters = request.query;

      const useCase = makeListSafetyProgramsUseCase();
      const { safetyPrograms } = await useCase.execute({
        tenantId,
        ...filters,
      });

      return reply.status(200).send({
        safetyPrograms: safetyPrograms.map(safetyProgramToDTO),
      });
    },
  });
}
