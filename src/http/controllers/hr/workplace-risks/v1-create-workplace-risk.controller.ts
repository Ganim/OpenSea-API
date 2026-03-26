import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createWorkplaceRiskSchema,
  workplaceRiskResponseSchema,
} from '@/http/schemas';
import { idSchema } from '@/http/schemas';
import { workplaceRiskToDTO } from '@/mappers/hr/workplace-risk';
import { makeCreateWorkplaceRiskUseCase } from '@/use-cases/hr/workplace-risks/factories/make-create-workplace-risk-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateWorkplaceRiskController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/safety-programs/:programId/risks',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.SAFETY.REGISTER,
        resource: 'safety-programs',
      }),
    ],
    schema: {
      tags: ['HR - Workplace Risks'],
      summary: 'Create workplace risk',
      description: 'Creates a new workplace risk for a safety program',
      params: z.object({
        programId: idSchema,
      }),
      body: createWorkplaceRiskSchema,
      response: {
        201: z.object({
          workplaceRisk: workplaceRiskResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { programId } = request.params;
      const data = request.body;

      try {
        const useCase = makeCreateWorkplaceRiskUseCase();
        const { workplaceRisk } = await useCase.execute({
          tenantId,
          safetyProgramId: programId,
          ...data,
        });

        return reply
          .status(201)
          .send({ workplaceRisk: workplaceRiskToDTO(workplaceRisk) });
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
