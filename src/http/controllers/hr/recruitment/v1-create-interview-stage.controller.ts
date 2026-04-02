import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createInterviewStageSchema,
  interviewStageResponseSchema,
} from '@/http/schemas/hr/recruitment';
import { interviewStageToDTO } from '@/mappers/hr/interview-stage';
import { makeCreateInterviewStageUseCase } from '@/use-cases/hr/interview-stages/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateInterviewStageController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/recruitment/interview-stages',
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
      summary: 'Create interview stage',
      description: 'Creates a new interview stage for a job posting',
      body: createInterviewStageSchema,
      response: {
        201: z.object({ interviewStage: interviewStageResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;
      try {
        const useCase = makeCreateInterviewStageUseCase();
        const { interviewStage } = await useCase.execute({ tenantId, ...data });
        return reply
          .status(201)
          .send({ interviewStage: interviewStageToDTO(interviewStage) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError)
          return reply.status(404).send({ message: error.message });
        if (error instanceof Error)
          return reply.status(400).send({ message: error.message });
        throw error;
      }
    },
  });
}
