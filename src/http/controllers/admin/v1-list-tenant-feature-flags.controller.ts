import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { SYSTEM_FEATURE_FLAGS } from '@/constants/feature-flags';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeListTenantFeatureFlagsUseCase } from '@/use-cases/admin/tenants/factories/make-list-tenant-feature-flags-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listTenantFeatureFlagsAdminController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/tenants/:id/feature-flags',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Tenants'],
      summary: 'List feature flags for a tenant (super admin)',
      description:
        'Returns all feature flags for a tenant along with the system-defined flags catalog.',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          featureFlags: z.array(
            z.object({
              id: z.string(),
              tenantId: z.string(),
              flag: z.string(),
              enabled: z.boolean(),
              metadata: z.record(z.string(), z.unknown()),
              createdAt: z.coerce.date(),
              updatedAt: z.coerce.date(),
            }),
          ),
          systemFlags: z.array(
            z.object({
              flag: z.string(),
              label: z.string(),
              description: z.string(),
              category: z.string(),
            }),
          ),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;

      try {
        const useCase = makeListTenantFeatureFlagsUseCase();
        const { featureFlags } = await useCase.execute({ tenantId: id });

        return reply.status(200).send({
          featureFlags,
          systemFlags: SYSTEM_FEATURE_FLAGS,
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
