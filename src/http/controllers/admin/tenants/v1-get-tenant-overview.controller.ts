import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeGetTenantOverviewUseCase } from '@/use-cases/admin/subscriptions/factories/make-get-tenant-overview';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import {
  presentTenantBilling,
  presentTenantConsumption,
  presentTenantSubscription,
} from './presenters';

export async function v1GetTenantOverviewController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/tenants/:tenantId/overview',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Tenant Subscriptions'],
      summary: 'Get tenant overview (super admin)',
      description:
        'Returns a comprehensive overview of a tenant including active subscriptions, consumption metrics, and billing for the specified period.',
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
          subscriptions: z.array(z.record(z.string(), z.unknown())),
          consumptions: z.array(z.record(z.string(), z.unknown())),
          billing: z.record(z.string(), z.unknown()).nullable(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { tenantId } = request.params;
      const { period } = request.query;

      const getTenantOverviewUseCase = makeGetTenantOverviewUseCase();
      const { subscriptions, consumptions, billing } =
        await getTenantOverviewUseCase.execute({ tenantId, period });

      return reply.status(200).send({
        subscriptions: subscriptions.map(presentTenantSubscription),
        consumptions: consumptions.map(presentTenantConsumption),
        billing: billing ? presentTenantBilling(billing) : null,
      });
    },
  });
}
