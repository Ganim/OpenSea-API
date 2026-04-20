import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listFaceEnrollmentsParamsSchema,
  listFaceEnrollmentsResponseSchema,
} from '@/http/schemas/hr/face-enrollment/list-face-enrollments.schema';
import { makeListFaceEnrollmentsUseCase } from '@/use-cases/hr/face-enrollments/factories/make-list-face-enrollments';

/**
 * GET /v1/hr/employees/:id/face-enrollments
 *
 * Returns metadata of active enrollments for the employee. Response is
 * scrubbed of embedding/iv/authTag (T-FACE-03 sentinel in the e2e spec).
 *
 * Permissão: hr.face-enrollment.access
 */
export async function v1ListFaceEnrollmentsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/employees/:id/face-enrollments',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.FACE_ENROLLMENT.ACCESS,
        resource: 'hr-face-enrollments',
      }),
    ],
    schema: {
      tags: ['HR - Face Enrollments'],
      summary: 'Lista biometrias faciais (metadata) de um funcionário',
      description:
        'Retorna apenas metadata: id, photoCount, capturedAt, capturedByUserId, createdAt. NUNCA retorna embedding/iv/authTag.',
      params: listFaceEnrollmentsParamsSchema,
      response: {
        200: listFaceEnrollmentsResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const useCase = makeListFaceEnrollmentsUseCase();
      const result = await useCase.execute({
        tenantId: request.user.tenantId!,
        employeeId: request.params.id,
      });
      return reply.status(200).send(result);
    },
  });
}
