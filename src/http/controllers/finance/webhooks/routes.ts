import type { FastifyInstance } from 'fastify';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import rawBody from 'fastify-raw-body';

import { sicoobWebhookController } from './v1-sicoob-webhook.controller';

export async function bankWebhookRoutes(app: FastifyInstance) {
  // No module middleware — webhooks are called by external banks without tenant context
  // No auth middleware — banks call directly; security is enforced by IP allowlists + secrets

  app.register(
    async (webhookApp) => {
      // Capture the unmodified request body for HMAC signature verification.
      // Sicoob signs the byte-stream as transmitted; re-serializing via
      // JSON.stringify(body) reorders keys/whitespace and breaks the signature.
      // Scoped to webhook routes only so global JSON parsing remains untouched.
      await webhookApp.register(rawBody, {
        field: 'rawBody',
        global: false,
        encoding: 'utf8',
        runFirst: true,
      });

      webhookApp.register(rateLimit, rateLimitConfig.financeWebhook);
      webhookApp.register(sicoobWebhookController);
    },
    { prefix: '' },
  );
}
