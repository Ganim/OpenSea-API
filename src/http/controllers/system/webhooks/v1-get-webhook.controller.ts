import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  errorResponseSchema,
  getWebhookResponseSchema,
  webhookIdParamsSchema,
} from '@/http/schemas/system/webhooks/webhook-schemas';
import { makeGetWebhookEndpointUseCase } from '@/use-cases/system/webhooks/factories/make-get-webhook-endpoint-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function v1GetWebhookController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/system/webhooks/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SYSTEM.WEBHOOKS.ENDPOINTS.ACCESS,
        resource: 'system-webhooks',
      }),
    ],
    schema: {
      tags: ['System - Webhooks'],
      summary: 'Detalhes de um webhook',
      params: webhookIdParamsSchema,
      response: { 200: getWebhookResponseSchema, 404: errorResponseSchema },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeGetWebhookEndpointUseCase();
        const result = await useCase.execute({
          id: request.params.id,
          tenantId: request.user.tenantId!,
        });
        return reply.status(200).send(result);
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
