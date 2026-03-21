import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeGetRevenueMetricsUseCase } from '@/use-cases/admin/monitoring/factories/make-get-revenue-metrics-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetRevenueMetricsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/monitoring/revenue',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Monitoring'],
      summary: 'Get revenue metrics (super admin)',
      description:
        'Returns revenue aggregation metrics including MRR from active subscriptions, overage totals, churn rate placeholder, and tenant count by status. Requires super admin privileges.',
      response: {
        200: z.object({
          mrr: z.number(),
          activeSubscriptionCount: z.number(),
          overageTotal: z.number(),
          churnRate: z.number(),
          tenantCountByStatus: z.record(z.string(), z.number()),
          period: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (_request, reply) => {
      const getRevenueMetricsUseCase = makeGetRevenueMetricsUseCase();
      const revenueMetrics = await getRevenueMetricsUseCase.execute();

      return reply.status(200).send(revenueMetrics);
    },
  });
}
