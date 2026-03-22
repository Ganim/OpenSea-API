import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListDashboardsUseCase } from '@/use-cases/sales/analytics/dashboards/factories/make-list-dashboards-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listDashboardsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/analytics/dashboards',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Sales - Analytics Dashboards'],
      summary: 'List analytics dashboards',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        perPage: z.coerce.number().int().positive().max(100).default(20),
        role: z
          .enum([
            'SELLER',
            'MANAGER',
            'DIRECTOR',
            'BID_SPECIALIST',
            'MARKETPLACE_OPS',
            'CASHIER',
          ])
          .optional(),
        visibility: z.enum(['PRIVATE', 'TEAM', 'TENANT']).optional(),
      }),
      response: {
        200: z.object({
          dashboards: z.array(z.any()),
          total: z.number(),
          page: z.number(),
          perPage: z.number(),
          totalPages: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query;

      const useCase = makeListDashboardsUseCase();
      const result = await useCase.execute({ tenantId, ...query });

      return reply.status(200).send(result);
    },
  });
}
