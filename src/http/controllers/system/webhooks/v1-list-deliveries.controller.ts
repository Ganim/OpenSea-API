import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  errorResponseSchema,
  listDeliveriesQuerySchema,
  listDeliveriesResponseSchema,
  webhookIdParamsSchema,
} from '@/http/schemas/system/webhooks/webhook-schemas';
import { makeListWebhookDeliveriesUseCase } from '@/use-cases/system/webhooks/factories/make-list-webhook-deliveries-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

/**
 * GET /v1/system/webhooks/:id/deliveries
 * Permissão: system.webhooks.endpoints.access
 */
export async function v1ListDeliveriesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/system/webhooks/:id/deliveries',
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
      summary: 'Listagem de deliveries (D-13 4 filtros)',
      params: webhookIdParamsSchema,
      querystring: listDeliveriesQuerySchema,
      response: {
        200: listDeliveriesResponseSchema,
        404: errorResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeListWebhookDeliveriesUseCase();
        const result = await useCase.execute({
          tenantId: request.user.tenantId!,
          endpointId: request.params.id,
          status: request.query.status,
          createdAfter: request.query.createdAfter,
          createdBefore: request.query.createdBefore,
          eventType: request.query.eventType,
          httpStatus: request.query.httpStatus,
          limit: request.query.limit,
          offset: request.query.offset,
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
