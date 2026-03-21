import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeRemoveTenantSubscriptionUseCase } from '@/use-cases/admin/subscriptions/factories/make-remove-tenant-subscription';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1RemoveTenantSubscriptionController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/admin/tenants/:tenantId/subscription/:skillCode',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Tenant Subscriptions'],
      summary: 'Remove tenant subscription (super admin)',
      description:
        'Cancels a specific skill subscription for a tenant. The subscription is marked as cancelled rather than deleted.',
      params: z.object({
        tenantId: z.string().uuid(),
        skillCode: z.string(),
      }),
      response: {
        200: z.object({
          success: z.boolean(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { tenantId, skillCode } = request.params;

      try {
        const removeTenantSubscriptionUseCase =
          makeRemoveTenantSubscriptionUseCase();
        const { success } = await removeTenantSubscriptionUseCase.execute({
          tenantId,
          skillCode,
        });

        return reply.status(200).send({ success });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
