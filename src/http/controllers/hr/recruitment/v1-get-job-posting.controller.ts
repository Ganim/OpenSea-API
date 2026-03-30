import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { jobPostingResponseSchema } from '@/http/schemas/hr/recruitment';
import { idSchema } from '@/http/schemas/common.schema';
import { jobPostingToDTO } from '@/mappers/hr/job-posting';
import { makeGetJobPostingUseCase } from '@/use-cases/hr/job-postings/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetJobPostingController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/recruitment/job-postings/:jobPostingId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Recruitment'],
      summary: 'Get job posting',
      description: 'Gets a job posting by ID',
      params: z.object({ jobPostingId: idSchema }),
      response: {
        200: z.object({ jobPosting: jobPostingResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { jobPostingId } = request.params;

      try {
        const useCase = makeGetJobPostingUseCase();
        const { jobPosting } = await useCase.execute({
          tenantId,
          jobPostingId,
        });

        return reply
          .status(200)
          .send({ jobPosting: jobPostingToDTO(jobPosting) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
