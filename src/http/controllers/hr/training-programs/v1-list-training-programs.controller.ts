import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listTrainingProgramsQuerySchema,
  trainingProgramResponseSchema,
} from '@/http/schemas/hr/training';
import { trainingProgramToDTO } from '@/mappers/hr/training-program';
import { makeListTrainingProgramsUseCase } from '@/use-cases/hr/training-programs/factories/make-list-training-programs-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListTrainingProgramsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/training-programs',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Training'],
      summary: 'List training programs',
      description: 'Lists all training programs with optional filters',
      querystring: listTrainingProgramsQuerySchema,
      response: {
        200: z.object({
          trainingPrograms: z.array(trainingProgramResponseSchema),
          total: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const filters = request.query;

      const useCase = makeListTrainingProgramsUseCase();
      const { trainingPrograms, total } = await useCase.execute({
        tenantId,
        ...filters,
      });

      return reply.status(200).send({
        trainingPrograms: trainingPrograms.map(trainingProgramToDTO),
        total,
      });
    },
  });
}
