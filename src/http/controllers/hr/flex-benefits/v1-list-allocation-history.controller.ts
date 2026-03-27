import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  flexBenefitAllocationResponseSchema,
  listAllocationHistoryQuerySchema,
} from '@/http/schemas/hr/benefits';
import { flexBenefitAllocationToDTO } from '@/mappers/hr/flex-benefit-allocation';
import { makeListAllocationHistoryUseCase } from '@/use-cases/hr/flex-benefits/factories/make-list-allocation-history-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListAllocationHistoryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/flex-benefits/history',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Benefits'],
      summary: 'List flex benefit allocation history',
      description: 'Lists flex benefit allocation history with filters',
      querystring: listAllocationHistoryQuerySchema,
      response: {
        200: z.object({
          allocations: z.array(flexBenefitAllocationResponseSchema),
          total: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const filters = request.query;

      const useCase = makeListAllocationHistoryUseCase();
      const { allocations, total } = await useCase.execute({
        tenantId,
        ...filters,
      });

      return reply.status(200).send({
        allocations: allocations.map(flexBenefitAllocationToDTO),
        total,
      });
    },
  });
}
