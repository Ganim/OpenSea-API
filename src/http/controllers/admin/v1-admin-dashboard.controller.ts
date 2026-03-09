import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeGetSystemStatsUseCase } from '@/use-cases/admin/dashboard/factories/make-get-system-stats-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function adminDashboardController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/dashboard',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Dashboard'],
      summary: 'Get system statistics (super admin)',
      description:
        'Returns comprehensive system statistics including tenants, plans, growth trends, recent admin activity, and revenue metrics. Requires super admin privileges.',
      response: {
        200: z.object({
          totalTenants: z.number(),
          totalPlans: z.number(),
          activePlans: z.number(),
          tenantsByStatus: z.record(z.string(), z.number()),
          tenantsByTier: z.record(z.string(), z.number()),
          monthlyGrowth: z.array(
            z.object({
              month: z.string(),
              count: z.number(),
            }),
          ),
          recentActivity: z.array(
            z.object({
              id: z.string(),
              action: z.string(),
              entity: z.string(),
              description: z.string().nullable(),
              createdAt: z.coerce.date(),
            }),
          ),
          totalUsers: z.number(),
          mrr: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const getSystemStatsUseCase = makeGetSystemStatsUseCase();
      const stats = await getSystemStatsUseCase.execute();

      return reply.status(200).send(stats);
    },
  });
}
