import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListReportsUseCase } from '@/use-cases/sales/analytics/reports/factories/make-list-reports-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listReportsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/analytics/reports',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['Sales - Analytics Reports'],
      summary: 'List analytics reports',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        perPage: z.coerce.number().int().positive().max(100).default(20),
        type: z.string().optional(),
        isScheduled: z.coerce.boolean().optional(),
        isActive: z.coerce.boolean().optional(),
      }),
      response: {
        200: z.object({
          reports: z.array(z.any()),
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

      const useCase = makeListReportsUseCase();
      const result = await useCase.execute({ tenantId, ...query });

      return reply.status(200).send(result);
    },
  });
}
