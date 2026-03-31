import type { FastifyInstance } from 'fastify';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { sicoobWebhookController } from './v1-sicoob-webhook.controller';

export async function bankWebhookRoutes(app: FastifyInstance) {
  // No module middleware — webhooks are called by external banks without tenant context
  // No auth middleware — banks call directly; security is enforced by IP allowlists + secrets

  app.register(
    async (webhookApp) => {
      webhookApp.register(rateLimit, rateLimitConfig.financeWebhook);
      webhookApp.register(sicoobWebhookController);
    },
    { prefix: '' },
  );
}
