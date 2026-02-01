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
        'Returns aggregate statistics about the system including total tenants and plans. Requires super admin privileges.',
      response: {
        200: z.object({
          totalTenants: z.number(),
          totalPlans: z.number(),
          activePlans: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const getSystemStatsUseCase = makeGetSystemStatsUseCase();
      const { totalTenants, totalPlans, activePlans } =
        await getSystemStatsUseCase.execute();

      return reply.status(200).send({
        totalTenants,
        totalPlans,
        activePlans,
      });
    },
  });
}
