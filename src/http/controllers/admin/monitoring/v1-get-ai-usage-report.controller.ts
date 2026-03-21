import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeGetAiUsageReportUseCase } from '@/use-cases/admin/monitoring/factories/make-get-ai-usage-report-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetAiUsageReportController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/monitoring/ai-usage',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Monitoring'],
      summary: 'Get AI usage report (super admin)',
      description:
        'Aggregates AI consumption metrics across all tenants for a given period. Shows total queries and cost by tier, and ranks top tenants by AI cost. Requires super admin privileges.',
      querystring: z.object({
        period: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .optional()
          .describe('Period in YYYY-MM format. Defaults to current month.'),
      }),
      response: {
        200: z.object({
          period: z.string(),
          totalAiQueries: z.number(),
          totalAiCost: z.number(),
          tierBreakdown: z.array(
            z.object({
              tier: z.string(),
              totalUsed: z.number(),
              totalIncluded: z.number(),
              totalOverage: z.number(),
              totalOverageCost: z.number(),
            }),
          ),
          topTenantsByAiCost: z.array(
            z.object({
              tenantId: z.string(),
              totalCost: z.number(),
              totalQueries: z.number(),
            }),
          ),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { period } = request.query;

      const getAiUsageReportUseCase = makeGetAiUsageReportUseCase();
      const aiUsageReport = await getAiUsageReportUseCase.execute({ period });

      return reply.status(200).send(aiUsageReport);
    },
  });
}
