import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { medicalExamResponseSchema } from '@/http/schemas';
import { medicalExamToDTO } from '@/mappers/hr/medical-exam';
import { makeListOverdueExamsUseCase } from '@/use-cases/hr/medical-exams/factories/make-list-overdue-exams-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListOverdueExamsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/medical-exams/overdue',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Medical Exams'],
      summary: 'List overdue medical exams',
      description: 'Lists medical exams that have passed their expiration date',
      response: {
        200: z.object({
          overdueExams: z.array(medicalExamResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeListOverdueExamsUseCase();
      const { overdueExams } = await useCase.execute({ tenantId });

      return reply.status(200).send({
        overdueExams: overdueExams.map(medicalExamToDTO),
      });
    },
  });
}
