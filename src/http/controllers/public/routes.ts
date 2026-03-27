import type { FastifyInstance } from 'fastify';
import { getPaymentLinkPublicController } from './v1-get-payment-link-public.controller';
import { renderLandingPageController } from './v1-render-landing-page.controller';

export async function publicRoutes(app: FastifyInstance) {
  // No auth middleware — these endpoints are public
  app.register(getPaymentLinkPublicController);
  app.register(renderLandingPageController);
}
