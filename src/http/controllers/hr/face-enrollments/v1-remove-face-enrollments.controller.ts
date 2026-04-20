import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createFaceEnrollmentsParamsSchema,
  removeFaceEnrollmentsResponseSchema,
} from '@/http/schemas/hr/face-enrollment/create-face-enrollments.schema';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeRemoveFaceEnrollmentsUseCase } from '@/use-cases/hr/face-enrollments/factories/make-remove-face-enrollments';

/**
 * DELETE /v1/hr/employees/:id/face-enrollments
 *
 * Admin soft-deletes every active face enrollment for the employee.
 * Idempotent: second call returns `removedCount: 0`.
 *
 * Permissão: hr.face-enrollment.remove
 */
export async function v1RemoveFaceEnrollmentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/employees/:id/face-enrollments',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.FACE_ENROLLMENT.REMOVE,
        resource: 'hr-face-enrollments',
      }),
    ],
    schema: {
      tags: ['HR - Face Enrollments'],
      summary: 'Remove a biometria facial (soft-delete) de um funcionário',
      description:
        'Idempotente — segunda chamada retorna removedCount: 0. Rows permanecem no banco com deletedAt preenchido para auditoria LGPD.',
      params: createFaceEnrollmentsParamsSchema,
      response: {
        200: removeFaceEnrollmentsResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const employeeId = request.params.id;
      const userId = request.user.sub;

      try {
        const employeesRepo = new PrismaEmployeesRepository();
        const employee = await employeesRepo.findById(
          new UniqueEntityID(employeeId),
          tenantId,
        );
        if (!employee) {
          return reply
            .status(404)
            .send({ message: 'Funcionário não encontrado' });
        }

        const useCase = makeRemoveFaceEnrollmentsUseCase();
        const result = await useCase.execute({ tenantId, employeeId });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.PUNCH_FACE_ENROLLMENT_REMOVED,
          entityId: employeeId,
          placeholders: {
            userName: userId,
            employeeName: employee.fullName,
          },
          newData: { removedCount: result.removedCount },
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
