import type { FastifyInstance } from 'fastify';
import { getPaymentLinkPublicController } from './v1-get-payment-link-public.controller';

export async function publicRoutes(app: FastifyInstance) {
  // No auth middleware — these endpoints are public
  app.register(getPaymentLinkPublicController);
}
