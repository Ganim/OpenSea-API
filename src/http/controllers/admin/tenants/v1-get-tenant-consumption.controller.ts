import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeGetTenantConsumptionUseCase } from '@/use-cases/admin/subscriptions/factories/make-get-tenant-consumption';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { presentTenantConsumption } from './presenters';

export async function v1GetTenantConsumptionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/tenants/:tenantId/consumption',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Tenant Subscriptions'],
      summary: 'Get tenant consumption (super admin)',
      description:
        'Returns usage/consumption metrics for a tenant in a specific period (defaults to current month).',
      params: z.object({
        tenantId: z.string().uuid(),
      }),
      querystring: z.object({
        period: z
          .string()
          .regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format')
          .optional(),
      }),
      response: {
        200: z.object({
          consumptions: z.array(z.record(z.string(), z.unknown())),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { tenantId } = request.params;
      const { period } = request.query;

      const getTenantConsumptionUseCase = makeGetTenantConsumptionUseCase();
      const { consumptions } = await getTenantConsumptionUseCase.execute({
        tenantId,
        period,
      });

      const formattedConsumptions = consumptions.map(presentTenantConsumption);

      return reply.status(200).send({ consumptions: formattedConsumptions });
    },
  });
}
