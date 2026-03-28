import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  enrollEmployeeInTrainingSchema,
  trainingEnrollmentResponseSchema,
} from '@/http/schemas/hr/training';
import { trainingEnrollmentToDTO } from '@/mappers/hr/training-enrollment';
import { makeEnrollEmployeeUseCase } from '@/use-cases/hr/training-enrollments/factories/make-enroll-employee-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1EnrollEmployeeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/training-enrollments',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.TRAINING.REGISTER,
        resource: 'training-enrollments',
      }),
    ],
    schema: {
      tags: ['HR - Training'],
      summary: 'Enroll employee in training',
      description: 'Enrolls an employee in a training program',
      body: enrollEmployeeInTrainingSchema,
      response: {
        201: z.object({ enrollment: trainingEnrollmentResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeEnrollEmployeeUseCase();
        const { enrollment } = await useCase.execute({
          tenantId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.TRAINING_ENROLLMENT_CREATE,
          entityId: enrollment.id.toString(),
          placeholders: {
            userName: request.user.sub,
            programName: data.trainingProgramId,
          },
          newData: data as Record<string, unknown>,
        });

        return reply
          .status(201)
          .send({ enrollment: trainingEnrollmentToDTO(enrollment) });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('não encontrado')) {
            return reply.status(404).send({ message: error.message });
          }
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
