import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { medicalExamResponseSchema } from '@/http/schemas';
import { idSchema } from '@/http/schemas';
import { medicalExamToDTO } from '@/mappers/hr/medical-exam';
import { makeGetMedicalExamUseCase } from '@/use-cases/hr/medical-exams/factories/make-get-medical-exam-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetMedicalExamController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/medical-exams/:examId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Medical Exams'],
      summary: 'Get medical exam',
      description: 'Gets a medical exam by ID',
      params: z.object({
        examId: idSchema,
      }),
      response: {
        200: z.object({
          medicalExam: medicalExamResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { examId } = request.params;

      try {
        const useCase = makeGetMedicalExamUseCase();
        const { medicalExam } = await useCase.execute({
          tenantId,
          examId,
        });

        return reply
          .status(200)
          .send({ medicalExam: medicalExamToDTO(medicalExam) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
