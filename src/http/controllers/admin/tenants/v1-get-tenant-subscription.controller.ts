import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeGetTenantSubscriptionUseCase } from '@/use-cases/admin/subscriptions/factories/make-get-tenant-subscription';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { presentTenantSubscription } from './presenters';

export async function v1GetTenantSubscriptionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/tenants/:tenantId/subscription',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Tenant Subscriptions'],
      summary: 'Get tenant subscriptions (super admin)',
      description:
        'Returns all subscriptions for a specific tenant, including active, cancelled, and expired ones.',
      params: z.object({
        tenantId: z.string().uuid(),
      }),
      response: {
        200: z.object({
          subscriptions: z.array(z.record(z.string(), z.unknown())),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { tenantId } = request.params;

      const getTenantSubscriptionUseCase = makeGetTenantSubscriptionUseCase();
      const { subscriptions } = await getTenantSubscriptionUseCase.execute({
        tenantId,
      });

      const formattedSubscriptions = subscriptions.map(
        presentTenantSubscription,
      );

      return reply.status(200).send({ subscriptions: formattedSubscriptions });
    },
  });
}
