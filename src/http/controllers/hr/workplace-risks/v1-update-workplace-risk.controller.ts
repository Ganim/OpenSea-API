import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateWorkplaceRiskSchema,
  workplaceRiskResponseSchema,
} from '@/http/schemas';
import { idSchema } from '@/http/schemas';
import { workplaceRiskToDTO } from '@/mappers/hr/workplace-risk';
import { makeUpdateWorkplaceRiskUseCase } from '@/use-cases/hr/workplace-risks/factories/make-update-workplace-risk-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateWorkplaceRiskController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/safety-programs/:programId/risks/:riskId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.SAFETY.MODIFY,
        resource: 'safety-programs',
      }),
    ],
    schema: {
      tags: ['HR - Workplace Risks'],
      summary: 'Update workplace risk',
      description: 'Updates an existing workplace risk',
      params: z.object({
        programId: idSchema,
        riskId: idSchema,
      }),
      body: updateWorkplaceRiskSchema,
      response: {
        200: z.object({
          workplaceRisk: workplaceRiskResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { riskId } = request.params;
      const data = request.body;

      try {
        const useCase = makeUpdateWorkplaceRiskUseCase();
        const { workplaceRisk } = await useCase.execute({
          tenantId,
          riskId,
          ...data,
        });

        return reply
          .status(200)
          .send({ workplaceRisk: workplaceRiskToDTO(workplaceRisk) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
