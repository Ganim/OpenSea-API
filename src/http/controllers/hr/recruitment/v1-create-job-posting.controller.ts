import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createJobPostingSchema,
  jobPostingResponseSchema,
} from '@/http/schemas/hr/recruitment';
import { jobPostingToDTO } from '@/mappers/hr/job-posting';
import { makeCreateJobPostingUseCase } from '@/use-cases/hr/job-postings/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateJobPostingController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/recruitment/job-postings',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.RECRUITMENT.REGISTER,
        resource: 'recruitment',
      }),
    ],
    schema: {
      tags: ['HR - Recruitment'],
      summary: 'Create job posting',
      description: 'Creates a new job posting (vacancy)',
      body: createJobPostingSchema,
      response: {
        201: z.object({ jobPosting: jobPostingResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeCreateJobPostingUseCase();
        const { jobPosting } = await useCase.execute({
          tenantId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.JOB_POSTING_CREATE,
          entityId: jobPosting.id.toString(),
          placeholders: {
            userName: request.user.sub,
            jobTitle: jobPosting.title,
          },
          newData: data as Record<string, unknown>,
        });

        return reply
          .status(201)
          .send({ jobPosting: jobPostingToDTO(jobPosting) });
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
