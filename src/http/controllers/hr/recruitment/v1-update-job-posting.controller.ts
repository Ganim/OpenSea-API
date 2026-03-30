import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  jobPostingResponseSchema,
  updateJobPostingSchema,
} from '@/http/schemas/hr/recruitment';
import { idSchema } from '@/http/schemas/common.schema';
import { jobPostingToDTO } from '@/mappers/hr/job-posting';
import { makeUpdateJobPostingUseCase } from '@/use-cases/hr/job-postings/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateJobPostingController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/recruitment/job-postings/:jobPostingId',
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
      summary: 'Update job posting',
      description: 'Updates an existing job posting',
      params: z.object({ jobPostingId: idSchema }),
      body: updateJobPostingSchema,
      response: {
        200: z.object({ jobPosting: jobPostingResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { jobPostingId } = request.params;
      const data = request.body;

      try {
        const useCase = makeUpdateJobPostingUseCase();
        const { jobPosting } = await useCase.execute({
          tenantId,
          jobPostingId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.JOB_POSTING_UPDATE,
          entityId: jobPosting.id.toString(),
          placeholders: {
            userName: request.user.sub,
            jobTitle: jobPosting.title,
          },
          newData: data as Record<string, unknown>,
        });

        return reply
          .status(200)
          .send({ jobPosting: jobPostingToDTO(jobPosting) });
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
