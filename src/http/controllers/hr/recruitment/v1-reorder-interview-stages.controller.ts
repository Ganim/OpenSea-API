import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { reorderInterviewStagesSchema } from '@/http/schemas/hr/recruitment';
import { cuidSchema } from '@/http/schemas/common.schema';
import { makeReorderInterviewStagesUseCase } from '@/use-cases/hr/interview-stages/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ReorderInterviewStagesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/recruitment/job-postings/:jobPostingId/stages/reorder',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.RECRUITMENT.MODIFY,
        resource: 'recruitment',
      }),
    ],
    schema: {
      tags: ['HR - Recruitment'],
      summary: 'Reorder interview stages',
      description:
        'Reorders the interview stages of a job posting by providing an ordered array of stage IDs',
      params: z.object({ jobPostingId: cuidSchema }),
      body: reorderInterviewStagesSchema,
      response: {
        200: z.object({ success: z.boolean() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { jobPostingId } = request.params;
      const { stageIds } = request.body;

      try {
        const useCase = makeReorderInterviewStagesUseCase();
        await useCase.execute({
          tenantId,
          jobPostingId,
          stageIds,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.INTERVIEW_STAGE_REORDER,
          entityId: jobPostingId,
          placeholders: {
            userName: request.user.sub,
            jobPostingId,
          },
        });

        return reply.status(200).send({ success: true });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
