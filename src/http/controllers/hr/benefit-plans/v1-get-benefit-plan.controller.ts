import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { benefitPlanResponseSchema } from '@/http/schemas/hr/benefits';
import { idSchema } from '@/http/schemas/common.schema';
import { benefitPlanToDTO } from '@/mappers/hr/benefit-plan';
import { makeGetBenefitPlanUseCase } from '@/use-cases/hr/benefit-plans/factories/make-get-benefit-plan-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetBenefitPlanController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/benefit-plans/:benefitPlanId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Benefits'],
      summary: 'Get benefit plan',
      description: 'Gets a benefit plan by ID',
      params: z.object({ benefitPlanId: idSchema }),
      response: {
        200: z.object({ benefitPlan: benefitPlanResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { benefitPlanId } = request.params;

      try {
        const useCase = makeGetBenefitPlanUseCase();
        const { benefitPlan } = await useCase.execute({
          tenantId,
          benefitPlanId,
        });

        return reply
          .status(200)
          .send({ benefitPlan: benefitPlanToDTO(benefitPlan) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
