import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { SALES_AUDIT_MESSAGES } from '@/constants/audit-messages/sales.messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  connectIntegrationBodySchema,
  tenantIntegrationResponseSchema,
} from '@/http/schemas/sales/integrations';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeConnectIntegrationUseCase } from '@/use-cases/sales/integrations/factories/make-connect-integration-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function connectIntegrationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/integrations/connect',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.INTEGRATIONS.REGISTER,
        resource: 'integrations',
      }),
    ],
    schema: {
      tags: ['Sales - Integrations'],
      summary: 'Connect a tenant to an integration',
      body: connectIntegrationBodySchema,
      response: {
        201: z.object({
          tenantIntegration: tenantIntegrationResponseSchema,
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
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { integrationId, config } = request.body;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeConnectIntegrationUseCase();
        const { tenantIntegration } = await useCase.execute({
          tenantId,
          integrationId,
          config,
        });

        await logAudit(request, {
          message: SALES_AUDIT_MESSAGES.INTEGRATION_CONNECT,
          entityId: tenantIntegration.id,
          placeholders: {
            userName,
            integrationName:
              tenantIntegration.integration?.name ?? integrationId,
          },
          newData: { integrationId, status: 'CONNECTED' },
        });

        return reply.status(201).send({ tenantIntegration });
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
