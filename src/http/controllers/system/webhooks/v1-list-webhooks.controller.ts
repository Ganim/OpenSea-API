import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listWebhooksQuerySchema,
  listWebhooksResponseSchema,
} from '@/http/schemas/system/webhooks/webhook-schemas';
import { makeListWebhookEndpointsUseCase } from '@/use-cases/system/webhooks/factories/make-list-webhook-endpoints-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

/**
 * GET /v1/system/webhooks
 * Lista webhooks do tenant + counters agregados.
 * Permissão: system.webhooks.endpoints.access
 */
export async function v1ListWebhooksController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/system/webhooks',
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
      summary: 'Lista webhooks do tenant',
      querystring: listWebhooksQuerySchema,
      response: { 200: listWebhooksResponseSchema },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const useCase = makeListWebhookEndpointsUseCase();
      const result = await useCase.execute({
        tenantId: request.user.tenantId!,
        status: request.query.status,
        search: request.query.search,
        limit: request.query.limit,
        offset: request.query.offset,
      });
      return reply.status(200).send(result);
    },
  });
}
