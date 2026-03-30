import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  examRequirementResponseSchema,
  listExamRequirementsQuerySchema,
} from '@/http/schemas';
import { occupationalExamRequirementToDTO } from '@/mappers/hr/occupational-exam-requirement';
import { makeListExamRequirementsUseCase } from '@/use-cases/hr/exam-requirements/factories/make-list-exam-requirements-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListExamRequirementsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/exam-requirements',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Exam Requirements'],
      summary: 'List occupational exam requirements',
      description:
        'Lists all occupational exam requirements with optional filters',
      querystring: listExamRequirementsQuerySchema,
      response: {
        200: z.object({
          examRequirements: z.array(examRequirementResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const filters = request.query;

      const useCase = makeListExamRequirementsUseCase();
      const { examRequirements } = await useCase.execute({
        tenantId,
        ...filters,
      });

      return reply.status(200).send({
        examRequirements: examRequirements.map(
          occupationalExamRequirementToDTO,
        ),
      });
    },
  });
}
