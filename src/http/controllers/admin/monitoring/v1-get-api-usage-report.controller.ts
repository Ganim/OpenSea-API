import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import {
  apiUsageQuerySchema,
  apiUsageResponseSchema,
} from '@/http/schemas/admin/monitoring/api-usage.schema';
import { makeGetApiUsageReportUseCase } from '@/use-cases/admin/monitoring/factories/make-get-api-usage-report-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function v1GetApiUsageReportController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/monitoring/api-usage',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Monitoring'],
      summary: 'Get comprehensive API usage report (super admin)',
      description:
        'Aggregates all external API consumption metrics across all tenants for a given period. Groups by category (AI, messaging, fiscal, marketplace, payments, storage), lists individual metrics within each category, and ranks top 10 tenants by total cost. Requires super admin privileges.',
      querystring: apiUsageQuerySchema,
      response: {
        200: apiUsageResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { period } = request.query;

      const getApiUsageReportUseCase = makeGetApiUsageReportUseCase();
      const apiUsageReport = await getApiUsageReportUseCase.execute({
        period,
      });

      return reply.status(200).send(apiUsageReport);
    },
  });
}
