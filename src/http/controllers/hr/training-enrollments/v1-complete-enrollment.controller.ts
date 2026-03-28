import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  completeTrainingEnrollmentSchema,
  trainingEnrollmentResponseSchema,
} from '@/http/schemas/hr/training';
import { idSchema } from '@/http/schemas/common.schema';
import { trainingEnrollmentToDTO } from '@/mappers/hr/training-enrollment';
import { makeCompleteEnrollmentUseCase } from '@/use-cases/hr/training-enrollments/factories/make-complete-enrollment-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CompleteEnrollmentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/training-enrollments/:enrollmentId/complete',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.TRAINING.MODIFY,
        resource: 'training-enrollments',
      }),
    ],
    schema: {
      tags: ['HR - Training'],
      summary: 'Complete training enrollment',
      description:
        'Marks a training enrollment as completed with optional score',
      params: z.object({ enrollmentId: idSchema }),
      body: completeTrainingEnrollmentSchema,
      response: {
        200: z.object({ enrollment: trainingEnrollmentResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { enrollmentId } = request.params;
      const data = request.body;

      try {
        const useCase = makeCompleteEnrollmentUseCase();
        const { enrollment } = await useCase.execute({
          tenantId,
          enrollmentId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.TRAINING_ENROLLMENT_COMPLETE,
          entityId: enrollmentId,
          placeholders: {
            userName: request.user.sub,
          },
          newData: data as Record<string, unknown>,
        });

        return reply
          .status(200)
          .send({ enrollment: trainingEnrollmentToDTO(enrollment) });
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
