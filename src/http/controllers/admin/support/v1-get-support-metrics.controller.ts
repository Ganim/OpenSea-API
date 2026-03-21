import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeGetSupportMetricsUseCase } from '@/use-cases/admin/support/factories/make-get-support-metrics-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getSupportMetricsAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/support/metrics',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Support'],
      summary: 'Get support metrics (super admin)',
      description:
        'Returns aggregate support metrics including ticket counts and satisfaction. Requires super admin privileges.',
      response: {
        200: z.object({
          totalTickets: z.number(),
          openTickets: z.number(),
          resolvedTickets: z.number(),
          closedTickets: z.number(),
          averageSatisfaction: z.number().nullable(),
          aiResolutionRate: z.number().nullable(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (_request, reply) => {
      const getSupportMetricsUseCase = makeGetSupportMetricsUseCase();
      const metrics = await getSupportMetricsUseCase.execute();

      return reply.status(200).send(metrics);
    },
  });
}
