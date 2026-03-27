import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { tenantIntegrationResponseSchema } from '@/http/schemas/sales/integrations';
import { makeGetTenantIntegrationsUseCase } from '@/use-cases/sales/integrations/factories/make-get-tenant-integrations-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getTenantIntegrationsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/integrations/tenant',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.INTEGRATIONS.ACCESS,
        resource: 'integrations',
      }),
    ],
    schema: {
      tags: ['Sales - Integrations'],
      summary: 'List tenant connected integrations',
      response: {
        200: z.object({
          tenantIntegrations: z.array(tenantIntegrationResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      const useCase = makeGetTenantIntegrationsUseCase();
      const { tenantIntegrations } = await useCase.execute({ tenantId });

      return reply.status(200).send({ tenantIntegrations });
    },
  });
}
