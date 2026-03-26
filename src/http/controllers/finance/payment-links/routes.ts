import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { createPaymentLinkController } from './v1-create-payment-link.controller';
import { listPaymentLinksController } from './v1-list-payment-links.controller';

export async function paymentLinksRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  app.register(createPaymentLinkController);
  app.register(listPaymentLinksController);
}
