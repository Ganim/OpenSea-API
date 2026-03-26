import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createMedicalExamSchema,
  medicalExamResponseSchema,
} from '@/http/schemas';
import { medicalExamToDTO } from '@/mappers/hr/medical-exam';
import { makeCreateMedicalExamUseCase } from '@/use-cases/hr/medical-exams/factories/make-create-medical-exam-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateMedicalExamController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/medical-exams',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.MEDICAL_EXAMS.REGISTER,
        resource: 'medical-exams',
      }),
    ],
    schema: {
      tags: ['HR - Medical Exams'],
      summary: 'Create medical exam',
      description: 'Creates a new medical exam for an employee',
      body: createMedicalExamSchema,
      response: {
        201: z.object({
          medicalExam: medicalExamResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeCreateMedicalExamUseCase();
        const { medicalExam } = await useCase.execute({
          tenantId,
          ...data,
        });

        return reply
          .status(201)
          .send({ medicalExam: medicalExamToDTO(medicalExam) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
