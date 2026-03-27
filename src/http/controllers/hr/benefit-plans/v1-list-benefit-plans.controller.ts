import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  benefitPlanResponseSchema,
  listBenefitPlansQuerySchema,
} from '@/http/schemas/hr/benefits';
import { benefitPlanToDTO } from '@/mappers/hr/benefit-plan';
import { makeListBenefitPlansUseCase } from '@/use-cases/hr/benefit-plans/factories/make-list-benefit-plans-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListBenefitPlansController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/benefit-plans',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Benefits'],
      summary: 'List benefit plans',
      description: 'Lists all benefit plans with optional filters',
      querystring: listBenefitPlansQuerySchema,
      response: {
        200: z.object({
          benefitPlans: z.array(benefitPlanResponseSchema),
          total: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const filters = request.query;

      const useCase = makeListBenefitPlansUseCase();
      const { benefitPlans, total } = await useCase.execute({
        tenantId,
        ...filters,
      });

      return reply.status(200).send({
        benefitPlans: benefitPlans.map(benefitPlanToDTO),
        total,
      });
    },
  });
}
