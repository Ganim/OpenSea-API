import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createExamRequirementSchema,
  examRequirementResponseSchema,
} from '@/http/schemas';
import { occupationalExamRequirementToDTO } from '@/mappers/hr/occupational-exam-requirement';
import { makeCreateExamRequirementUseCase } from '@/use-cases/hr/exam-requirements/factories/make-create-exam-requirement-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateExamRequirementController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/exam-requirements',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.MEDICAL_EXAMS.REGISTER,
        resource: 'exam-requirements',
      }),
    ],
    schema: {
      tags: ['HR - Exam Requirements'],
      summary: 'Create occupational exam requirement',
      description:
        'Creates a new occupational exam requirement for PCMSO compliance',
      body: createExamRequirementSchema,
      response: {
        201: z.object({
          examRequirement: examRequirementResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeCreateExamRequirementUseCase();
        const { examRequirement } = await useCase.execute({
          tenantId,
          ...data,
        });

        return reply.status(201).send({
          examRequirement: occupationalExamRequirementToDTO(examRequirement),
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
