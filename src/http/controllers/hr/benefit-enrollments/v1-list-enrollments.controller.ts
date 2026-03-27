import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  benefitEnrollmentResponseSchema,
  listEnrollmentsQuerySchema,
} from '@/http/schemas/hr/benefits';
import { benefitEnrollmentToDTO } from '@/mappers/hr/benefit-enrollment';
import { makeListEnrollmentsUseCase } from '@/use-cases/hr/benefit-enrollments/factories/make-list-enrollments-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListEnrollmentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/benefit-enrollments',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Benefits'],
      summary: 'List benefit enrollments',
      description: 'Lists all benefit enrollments with optional filters',
      querystring: listEnrollmentsQuerySchema,
      response: {
        200: z.object({
          enrollments: z.array(benefitEnrollmentResponseSchema),
          total: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const filters = request.query;

      const useCase = makeListEnrollmentsUseCase();
      const { enrollments, total } = await useCase.execute({
        tenantId,
        ...filters,
      });

      return reply.status(200).send({
        enrollments: enrollments.map(benefitEnrollmentToDTO),
        total,
      });
    },
  });
}
