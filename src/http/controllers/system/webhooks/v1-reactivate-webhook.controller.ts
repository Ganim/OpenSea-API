import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { verifyActionPin } from '@/http/middlewares/verify-action-pin';
import {
  errorResponseSchema,
  reactivateWebhookResponseSchema,
  webhookIdParamsSchema,
} from '@/http/schemas/system/webhooks/webhook-schemas';
import { makeReactivateWebhookEndpointUseCase } from '@/use-cases/system/webhooks/factories/make-reactivate-webhook-endpoint-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

/**
 * POST /v1/system/webhooks/:id/reactivate — PIN-gated.
 * Permissão: system.webhooks.endpoints.admin + verifyActionPin
 */
export async function v1ReactivateWebhookController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/system/webhooks/:id/reactivate',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.ADMIN,
        resource: 'system-webhooks',
      }),
      verifyActionPin,
    ],
    schema: {
      tags: ['System - Webhooks'],
      summary: 'Reativa webhook AUTO_DISABLED — PIN-gated',
      params: webhookIdParamsSchema,
      response: {
        200: reactivateWebhookResponseSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeReactivateWebhookEndpointUseCase();
        const result = await useCase.execute({
          id: request.params.id,
          tenantId: request.user.tenantId!,
        });
        return reply.status(200).send(result);
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        if (err instanceof BadRequestError) {
          return reply.status(400).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
