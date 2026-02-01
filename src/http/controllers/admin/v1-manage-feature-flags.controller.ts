import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeManageTenantFeatureFlagsUseCase } from '@/use-cases/admin/tenants/factories/make-manage-tenant-feature-flags-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function manageFeatureFlagsAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/admin/tenants/:id/feature-flags',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Tenants'],
      summary: 'Manage tenant feature flags (super admin)',
      description:
        'Enables or disables a specific feature flag for a tenant. Feature flags control access to optional modules and features. Requires super admin privileges.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        flag: z.string().min(1).max(100),
        enabled: z.boolean(),
      }),
      response: {
        200: z.object({
          featureFlag: z.object({
            id: z.string(),
            tenantId: z.string(),
            flag: z.string(),
            enabled: z.boolean(),
            metadata: z.record(z.string(), z.unknown()),
            createdAt: z.coerce.date(),
            updatedAt: z.coerce.date(),
          }),
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const { flag, enabled } = request.body;

      try {
        const manageFeatureFlagsUseCase = makeManageTenantFeatureFlagsUseCase();
        const { featureFlag } = await manageFeatureFlagsUseCase.execute({
          tenantId: id,
          flag,
          enabled,
        });

        return reply.status(200).send({ featureFlag });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
