import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { workplaceRiskResponseSchema } from '@/http/schemas';
import { idSchema } from '@/http/schemas';
import { workplaceRiskToDTO } from '@/mappers/hr/workplace-risk';
import { makeGetWorkplaceRiskUseCase } from '@/use-cases/hr/workplace-risks/factories/make-get-workplace-risk-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetWorkplaceRiskController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/safety-programs/:programId/risks/:riskId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Workplace Risks'],
      summary: 'Get workplace risk',
      description: 'Gets a workplace risk by ID',
      params: z.object({
        programId: idSchema,
        riskId: idSchema,
      }),
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

      try {
        const useCase = makeGetWorkplaceRiskUseCase();
        const { workplaceRisk } = await useCase.execute({
          tenantId,
          riskId,
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
