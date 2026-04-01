import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { cuidSchema } from '@/http/schemas/common.schema';
import { makeDeleteInterviewStageUseCase } from '@/use-cases/hr/interview-stages/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteInterviewStageController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/recruitment/interview-stages/:interviewStageId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.RECRUITMENT.REMOVE,
        resource: 'recruitment',
      }),
    ],
    schema: {
      tags: ['HR - Recruitment'],
      summary: 'Delete interview stage',
      description: 'Deletes an interview stage from a job posting',
      params: z.object({ interviewStageId: cuidSchema }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { interviewStageId } = request.params;

      try {
        const useCase = makeDeleteInterviewStageUseCase();
        await useCase.execute({
          tenantId,
          interviewStageId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.INTERVIEW_STAGE_DELETE,
          entityId: interviewStageId,
          placeholders: {
            userName: request.user.sub,
            stageName: interviewStageId,
          },
        });

        return reply.status(204).send({ success: true });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
