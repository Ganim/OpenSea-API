import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  errorResponseSchema,
  getWebhookResponseSchema,
  updateWebhookBodySchema,
  webhookIdParamsSchema,
} from '@/http/schemas/system/webhooks/webhook-schemas';
import { makeUpdateWebhookEndpointUseCase } from '@/use-cases/system/webhooks/factories/make-update-webhook-endpoint-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function v1UpdateWebhookController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/system/webhooks/:id',
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
      summary: 'Atualiza um webhook (description / subscribedEvents / status)',
      params: webhookIdParamsSchema,
      body: updateWebhookBodySchema,
      response: {
        200: getWebhookResponseSchema,
        400: errorResponseSchema,
        404: errorResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeUpdateWebhookEndpointUseCase();
        const result = await useCase.execute({
          id: request.params.id,
          tenantId: request.user.tenantId!,
          description: request.body.description,
          subscribedEvents: request.body.subscribedEvents,
          status: request.body.status,
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
