import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  errorResponseSchema,
  reprocessBulkBodySchema,
  reprocessBulkResponseSchema,
  webhookIdParamsSchema,
} from '@/http/schemas/system/webhooks/webhook-schemas';
import { makeReprocessWebhookDeliveriesBulkUseCase } from '@/use-cases/system/webhooks/factories/make-reprocess-webhook-deliveries-bulk-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function v1ReprocessDeliveriesBulkController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/system/webhooks/:id/deliveries/reprocess-bulk',
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
      summary: 'Reenvio em lote (cap individual aplicado por delivery)',
      params: webhookIdParamsSchema,
      body: reprocessBulkBodySchema,
      response: {
        200: reprocessBulkResponseSchema,
        400: errorResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const useCase = makeReprocessWebhookDeliveriesBulkUseCase();
      const result = await useCase.execute({
        deliveryIds: request.body.deliveryIds,
        tenantId: request.user.tenantId!,
        actorUserId: request.user.sub,
      });
      return reply.status(200).send(result);
    },
  });
}
