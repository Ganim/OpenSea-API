import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { verifyActionPin } from '@/http/middlewares/verify-action-pin';
import {
  errorResponseSchema,
  webhookIdParamsSchema,
} from '@/http/schemas/system/webhooks/webhook-schemas';
import { makeDeleteWebhookEndpointUseCase } from '@/use-cases/system/webhooks/factories/make-delete-webhook-endpoint-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

/**
 * DELETE /v1/system/webhooks/:id — PIN-gated.
 * Permissão: system.webhooks.endpoints.remove + verifyActionPin
 */
export async function v1DeleteWebhookController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/system/webhooks/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.REMOVE,
        resource: 'system-webhooks',
      }),
      verifyActionPin,
    ],
    schema: {
      tags: ['System - Webhooks'],
      summary: 'Exclui webhook (soft-delete) — PIN-gated',
      params: webhookIdParamsSchema,
      response: {
        204: errorResponseSchema.optional(),
        404: errorResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeDeleteWebhookEndpointUseCase();
        await useCase.execute({
          id: request.params.id,
          tenantId: request.user.tenantId!,
        });
        await logAudit(request, {
          message: AUDIT_MESSAGES.SYSTEM.WEBHOOK_DELETED,
          entityId: request.params.id,
          placeholders: { webhookId: request.params.id },
        });
        return reply.status(204).send();
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
