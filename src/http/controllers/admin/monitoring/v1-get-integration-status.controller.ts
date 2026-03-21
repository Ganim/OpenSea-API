import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeGetIntegrationStatusUseCase } from '@/use-cases/admin/monitoring/factories/make-get-integration-status-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetIntegrationStatusController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/monitoring/integrations',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Monitoring'],
      summary: 'Get integration status overview (super admin)',
      description:
        'Aggregates all tenant integration statuses across the platform. Shows counts by status, breakdown by integration type, and lists tenants with errors. Requires super admin privileges.',
      response: {
        200: z.object({
          totalIntegrations: z.number(),
          countByStatus: z.object({
            CONNECTED: z.number(),
            DISCONNECTED: z.number(),
            ERROR: z.number(),
            NOT_CONFIGURED: z.number(),
          }),
          byType: z.array(
            z.object({
              integrationType: z.string(),
              total: z.number(),
              byStatus: z.record(z.string(), z.number()),
            }),
          ),
          tenantsWithErrors: z.array(
            z.object({
              tenantId: z.string(),
              integrationType: z.string(),
              errorMessage: z.string().nullable(),
              lastCheckAt: z.coerce.date().nullable(),
            }),
          ),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (_request, reply) => {
      const getIntegrationStatusUseCase = makeGetIntegrationStatusUseCase();
      const integrationStatus = await getIntegrationStatusUseCase.execute();

      return reply.status(200).send(integrationStatus);
    },
  });
}
