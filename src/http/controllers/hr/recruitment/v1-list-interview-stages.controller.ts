import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { interviewStageResponseSchema } from '@/http/schemas/hr/recruitment';
import { cuidSchema } from '@/http/schemas/common.schema';
import { interviewStageToDTO } from '@/mappers/hr/interview-stage';
import { makeListInterviewStagesUseCase } from '@/use-cases/hr/interview-stages/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListInterviewStagesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/recruitment/job-postings/:jobPostingId/stages',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Recruitment'],
      summary: 'List interview stages',
      description: 'Lists all interview stages for a job posting',
      params: z.object({ jobPostingId: cuidSchema }),
      response: {
        200: z.object({
          interviewStages: z.array(interviewStageResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { jobPostingId } = request.params;
      const useCase = makeListInterviewStagesUseCase();
      const { interviewStages } = await useCase.execute({
        tenantId,
        jobPostingId,
      });
      return reply
        .status(200)
        .send({ interviewStages: interviewStages.map(interviewStageToDTO) });
    },
  });
}
