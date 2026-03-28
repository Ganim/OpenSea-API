import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listTrainingEnrollmentsQuerySchema,
  trainingEnrollmentResponseSchema,
} from '@/http/schemas/hr/training';
import { trainingEnrollmentToDTO } from '@/mappers/hr/training-enrollment';
import { makeListTrainingEnrollmentsUseCase } from '@/use-cases/hr/training-enrollments/factories/make-list-training-enrollments-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListTrainingEnrollmentsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/training-enrollments',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Training'],
      summary: 'List training enrollments',
      description: 'Lists all training enrollments with optional filters',
      querystring: listTrainingEnrollmentsQuerySchema,
      response: {
        200: z.object({
          enrollments: z.array(trainingEnrollmentResponseSchema),
          total: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const filters = request.query;

      const useCase = makeListTrainingEnrollmentsUseCase();
      const { enrollments, total } = await useCase.execute({
        tenantId,
        ...filters,
      });

      return reply.status(200).send({
        enrollments: enrollments.map(trainingEnrollmentToDTO),
        total,
      });
    },
  });
}
