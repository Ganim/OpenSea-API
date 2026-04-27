import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createWebhookBodySchema,
  createWebhookResponseSchema,
  errorResponseSchema,
} from '@/http/schemas/system/webhooks/webhook-schemas';
import { TenantWebhookCapReachedError } from '@/use-cases/system/webhooks/create-webhook-endpoint';
import { makeCreateWebhookEndpointUseCase } from '@/use-cases/system/webhooks/factories/make-create-webhook-endpoint-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

/**
 * POST /v1/system/webhooks
 * Cria webhook outbound. Retorna `secret` cleartext UMA VEZ (D-08 visible-once).
 * Permissão: system.webhooks.endpoints.register
 */
export async function v1CreateWebhookController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/system/webhooks',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.REGISTER,
        resource: 'system-webhooks',
      }),
    ],
    schema: {
      tags: ['System - Webhooks'],
      summary: 'Cria webhook outbound',
      description:
        'Cria endpoint webhook + retorna secret cleartext UMA VEZ no body. Aplicação anti-SSRF + cap 50/tenant + allowlist de eventos.',
      body: createWebhookBodySchema,
      response: {
        201: createWebhookResponseSchema,
        400: errorResponseSchema,
        422: errorResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeCreateWebhookEndpointUseCase();
        const result = await useCase.execute({
          tenantId: request.user.tenantId!,
          url: request.body.url,
          description: request.body.description ?? null,
          subscribedEvents: request.body.subscribedEvents,
          apiVersion: request.body.apiVersion,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SYSTEM.WEBHOOK_REGISTERED,
          entityId: result.endpoint.id,
          placeholders: {
            webhookUrlHost: new URL(result.endpoint.url).hostname,
            subscribedCount: result.endpoint.subscribedEvents.length.toString(),
          },
        });

        return reply.status(201).send(result);
      } catch (err) {
        if (err instanceof TenantWebhookCapReachedError) {
          return reply.status(422).send({ message: err.message });
        }
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        if (err instanceof Error) {
          return reply.status(400).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
