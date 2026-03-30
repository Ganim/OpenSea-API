import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteExamRequirementUseCase } from '@/use-cases/hr/exam-requirements/factories/make-delete-exam-requirement-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteExamRequirementController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/exam-requirements/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.MEDICAL_EXAMS.REMOVE,
        resource: 'exam-requirements',
      }),
    ],
    schema: {
      tags: ['HR - Exam Requirements'],
      summary: 'Delete occupational exam requirement',
      description: 'Deletes an occupational exam requirement',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        204: z.null(),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const useCase = makeDeleteExamRequirementUseCase();
        await useCase.execute({
          tenantId,
          requirementId: id,
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
