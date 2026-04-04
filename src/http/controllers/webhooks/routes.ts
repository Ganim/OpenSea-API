import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { v1InfinitepayWebhookController } from './v1-infinitepay-webhook.controller';
import { v1AsaasWebhookController } from './v1-asaas-webhook.controller';

export async function paymentWebhookRoutes(app: FastifyInstance) {
  // NO module middleware — webhooks are called by external payment providers without tenant context
  // NO auth middleware — providers call directly; security is enforced by provider signature validation

  app.register(
    async (webhookApp) => {
      webhookApp.register(rateLimit, rateLimitConfig.paymentWebhook);
      webhookApp.register(v1InfinitepayWebhookController);
      webhookApp.register(v1AsaasWebhookController);
    },
    { prefix: '' },
  );
}
