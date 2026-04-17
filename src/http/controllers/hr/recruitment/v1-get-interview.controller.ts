import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { interviewResponseSchema } from '@/http/schemas/hr/recruitment';
import { cuidSchema } from '@/http/schemas/common.schema';
import { interviewToDTO } from '@/mappers/hr/interview';
import { makeGetInterviewUseCase } from '@/use-cases/hr/interviews/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetInterviewController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/recruitment/interviews/:interviewId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.RECRUITMENT.ACCESS,
        resource: 'recruitment',
      }),
    ],
    schema: {
      tags: ['HR - Recruitment'],
      summary: 'Get interview',
      description: 'Gets an interview by ID',
      params: z.object({ interviewId: cuidSchema }),
      response: {
        200: z.object({ interview: interviewResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { interviewId } = request.params;

      try {
        const useCase = makeGetInterviewUseCase();
        const { interview } = await useCase.execute({
          tenantId,
          interviewId,
        });

        return reply.status(200).send({ interview: interviewToDTO(interview) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
