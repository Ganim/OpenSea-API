import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas/common.schema';
import { makeCancelEnrollmentUseCase } from '@/use-cases/hr/training-enrollments/factories/make-cancel-enrollment-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CancelEnrollmentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/training-enrollments/:enrollmentId/cancel',
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
      summary: 'Cancel training enrollment',
      description: 'Cancels a training enrollment',
      params: z.object({ enrollmentId: idSchema }),
      response: {
        204: z.null(),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { enrollmentId } = request.params;

      try {
        const useCase = makeCancelEnrollmentUseCase();
        await useCase.execute({
          tenantId,
          enrollmentId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.TRAINING_ENROLLMENT_CANCEL,
          entityId: enrollmentId,
          placeholders: {
            userName: request.user.sub,
          },
        });

        return reply.status(204).send(null);
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
