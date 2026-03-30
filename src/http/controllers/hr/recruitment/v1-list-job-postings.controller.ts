import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  jobPostingResponseSchema,
  listJobPostingsQuerySchema,
} from '@/http/schemas/hr/recruitment';
import { jobPostingToDTO } from '@/mappers/hr/job-posting';
import { makeListJobPostingsUseCase } from '@/use-cases/hr/job-postings/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListJobPostingsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/recruitment/job-postings',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Recruitment'],
      summary: 'List job postings',
      description: 'Lists all job postings with optional filters',
      querystring: listJobPostingsQuerySchema,
      response: {
        200: z.object({
          jobPostings: z.array(jobPostingResponseSchema),
          total: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const filters = request.query;

      const useCase = makeListJobPostingsUseCase();
      const { jobPostings, total } = await useCase.execute({
        tenantId,
        ...filters,
      });

      return reply.status(200).send({
        jobPostings: jobPostings.map(jobPostingToDTO),
        total,
      });
    },
  });
}
