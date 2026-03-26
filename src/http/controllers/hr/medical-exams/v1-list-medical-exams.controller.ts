import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  medicalExamResponseSchema,
  listMedicalExamsQuerySchema,
} from '@/http/schemas';
import { medicalExamToDTO } from '@/mappers/hr/medical-exam';
import { makeListMedicalExamsUseCase } from '@/use-cases/hr/medical-exams/factories/make-list-medical-exams-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListMedicalExamsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/medical-exams',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Medical Exams'],
      summary: 'List medical exams',
      description: 'Lists all medical exams with optional filters',
      querystring: listMedicalExamsQuerySchema,
      response: {
        200: z.object({
          medicalExams: z.array(medicalExamResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const filters = request.query;

      const useCase = makeListMedicalExamsUseCase();
      const { medicalExams } = await useCase.execute({
        tenantId,
        ...filters,
      });

      return reply.status(200).send({
        medicalExams: medicalExams.map(medicalExamToDTO),
      });
    },
  });
}
