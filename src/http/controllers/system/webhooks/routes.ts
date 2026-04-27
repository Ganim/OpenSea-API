/**
 * System Webhooks routes aggregator — Phase 11 / Plan 11-02 / D-11.
 *
 * NOTA: NÃO usar createModuleMiddleware('HR') — webhooks são platform-level
 * (ADR-032). Não consomem `WebhookEndpoint` de nenhum módulo de plano.
 */
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';

import { rateLimitConfig } from '@/config/rate-limits';

import { v1CreateWebhookController } from './v1-create-webhook.controller';
import { v1DeleteWebhookController } from './v1-delete-webhook.controller';
import { v1GetWebhookController } from './v1-get-webhook.controller';
import { v1ListDeliveriesController } from './v1-list-deliveries.controller';
import { v1ListWebhooksController } from './v1-list-webhooks.controller';
import { v1PingWebhookController } from './v1-ping-webhook.controller';
import { v1ReactivateWebhookController } from './v1-reactivate-webhook.controller';
import { v1RegenerateWebhookSecretController } from './v1-regenerate-webhook-secret.controller';
import { v1ReprocessDeliveriesBulkController } from './v1-reprocess-deliveries-bulk.controller';
import { v1ReprocessDeliveryController } from './v1-reprocess-delivery.controller';
import { v1UpdateWebhookController } from './v1-update-webhook.controller';

export async function systemWebhooksRoutes(app: FastifyInstance) {
  // Mutation routes (rate-limit mais estrito)
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateWebhookController);
      mutationApp.register(v1UpdateWebhookController);
      mutationApp.register(v1DeleteWebhookController);
      mutationApp.register(v1RegenerateWebhookSecretController);
      mutationApp.register(v1ReactivateWebhookController);
      mutationApp.register(v1ReprocessDeliveryController);
      mutationApp.register(v1ReprocessDeliveriesBulkController);
      mutationApp.register(v1PingWebhookController);
    },
    { prefix: '' },
  );

  // Query routes (rate-limit mais permissivo)
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListWebhooksController);
      queryApp.register(v1GetWebhookController);
      queryApp.register(v1ListDeliveriesController);
    },
    { prefix: '' },
  );
}
