import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { SALES_AUDIT_MESSAGES } from '@/constants/audit-messages/sales.messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { tenantIntegrationResponseSchema } from '@/http/schemas/sales/integrations';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDisconnectIntegrationUseCase } from '@/use-cases/sales/integrations/factories/make-disconnect-integration-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function disconnectIntegrationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/integrations/:tenantIntegrationId/disconnect',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.INTEGRATIONS.MODIFY,
        resource: 'integrations',
      }),
    ],
    schema: {
      tags: ['Sales - Integrations'],
      summary: 'Disconnect a tenant integration',
      params: z.object({
        tenantIntegrationId: z.string().uuid(),
      }),
      response: {
        200: z.object({
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
      const { tenantIntegrationId } = request.params;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeDisconnectIntegrationUseCase();
        const { tenantIntegration } = await useCase.execute({
          tenantId,
          tenantIntegrationId,
        });

        await logAudit(request, {
          message: SALES_AUDIT_MESSAGES.INTEGRATION_DISCONNECT,
          entityId: tenantIntegration.id,
          placeholders: {
            userName,
            integrationName:
              tenantIntegration.integration?.name ?? tenantIntegrationId,
          },
        });

        return reply.status(200).send({ tenantIntegration });
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
