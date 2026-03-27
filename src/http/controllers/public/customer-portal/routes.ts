import type { FastifyInstance } from 'fastify';
import { validatePortalTokenController } from './v1-validate-portal-token.controller';
import { listPortalInvoicesController } from './v1-list-portal-invoices.controller';
import { getPortalInvoiceController } from './v1-get-portal-invoice.controller';
import { generatePortalPaymentController } from './v1-generate-portal-payment.controller';

/**
 * Customer Portal public routes.
 * No auth middleware — these endpoints use token-based access.
 */
export async function customerPortalPublicRoutes(app: FastifyInstance) {
  app.register(validatePortalTokenController);
  app.register(listPortalInvoicesController);
  app.register(getPortalInvoiceController);
  app.register(generatePortalPaymentController);
}
