import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { TooManyRequestsError } from '@/@errors/use-cases/too-many-requests-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  errorResponseSchema,
  reprocessDeliveryResponseSchema,
  webhookDeliveryParamsSchema,
} from '@/http/schemas/system/webhooks/webhook-schemas';
import { makeReprocessWebhookDeliveryUseCase } from '@/use-cases/system/webhooks/factories/make-reprocess-webhook-delivery-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

/**
 * POST /v1/system/webhooks/:id/deliveries/:deliveryId/reprocess
 * Permissão: system.webhooks.endpoints.modify
 */
export async function v1ReprocessDeliveryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/system/webhooks/:id/deliveries/:deliveryId/reprocess',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.MODIFY,
        resource: 'system-webhooks',
      }),
    ],
    schema: {
      tags: ['System - Webhooks'],
      summary: 'Reenvio manual (cap 3 + cooldown 30s — D-21)',
      params: webhookDeliveryParamsSchema,
      response: {
        200: reprocessDeliveryResponseSchema,
        404: errorResponseSchema,
        422: errorResponseSchema,
        429: errorResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeReprocessWebhookDeliveryUseCase();
        const result = await useCase.execute({
          deliveryId: request.params.deliveryId,
          tenantId: request.user.tenantId!,
          actorUserId: request.user.sub,
        });
        await logAudit(request, {
          message: AUDIT_MESSAGES.SYSTEM.WEBHOOK_DELIVERY_REPROCESSED,
          entityId: request.params.deliveryId,
          placeholders: {
            deliveryId: request.params.deliveryId,
            manualReprocessCount: result.newReprocessCount.toString(),
          },
        });
        return reply.status(200).send(result);
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        if (err instanceof TooManyRequestsError) {
          return reply.status(429).send({ message: err.message });
        }
        if (err instanceof BadRequestError) {
          return reply.status(422).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
