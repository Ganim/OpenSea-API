import type { FastifyInstance } from 'fastify';
import { v1CreatePixChargeController } from './v1-create-pix-charge.controller';
import { v1ListPixChargesController } from './v1-list-pix-charges.controller';
import { v1PixWebhookController } from './v1-pix-webhook.controller';

export async function cashierRoutes(app: FastifyInstance) {
  // PIX charge management (authenticated)
  await app.register(v1CreatePixChargeController);
  await app.register(v1ListPixChargesController);

  // Webhook (public)
  await app.register(v1PixWebhookController);
}
