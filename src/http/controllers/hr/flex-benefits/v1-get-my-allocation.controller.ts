import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  flexBenefitAllocationResponseSchema,
  getMyAllocationQuerySchema,
} from '@/http/schemas/hr/benefits';
import { flexBenefitAllocationToDTO } from '@/mappers/hr/flex-benefit-allocation';
import { makeGetMyAllocationUseCase } from '@/use-cases/hr/flex-benefits/factories/make-get-my-allocation-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetMyAllocationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/flex-benefits/my-allocation',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Benefits'],
      summary: 'Get my flex benefit allocation',
      description:
        'Gets the current month flex benefit allocation for the logged-in employee',
      querystring: getMyAllocationQuerySchema,
      response: {
        200: z.object({
          allocation: flexBenefitAllocationResponseSchema.nullable(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const employeeId = request.user.sub;
      const { month, year } = request.query;

      const useCase = makeGetMyAllocationUseCase();
      const { allocation } = await useCase.execute({
        tenantId,
        employeeId,
        month,
        year,
      });

      return reply.status(200).send({
        allocation: allocation ? flexBenefitAllocationToDTO(allocation) : null,
      });
    },
  });
}
