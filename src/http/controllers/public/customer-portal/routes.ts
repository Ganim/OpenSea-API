import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { validatePortalTokenController } from './v1-validate-portal-token.controller';
import { listPortalInvoicesController } from './v1-list-portal-invoices.controller';
import { getPortalInvoiceController } from './v1-get-portal-invoice.controller';
import { generatePortalPaymentController } from './v1-generate-portal-payment.controller';

/**
 * Customer Portal public routes.
 * No auth middleware — these endpoints use token-based access.
 * Rate-limited por token+IP para prevenir brute-force de tokens de portal.
 */
export async function customerPortalPublicRoutes(app: FastifyInstance) {
  const portalKeyGenerator = (req: FastifyRequest) => {
    const params = req.params as { token?: string };
    return params.token
      ? `portal:${params.token}:${req.ip}`
      : `portal:${req.ip}`;
  };

  app.register(async (portalApp) => {
    portalApp.register(rateLimit, {
      ...rateLimitConfig.customerPortal,
      keyGenerator: portalKeyGenerator,
    });
    portalApp.register(validatePortalTokenController);
    portalApp.register(listPortalInvoicesController);
    portalApp.register(getPortalInvoiceController);
    portalApp.register(generatePortalPaymentController);
  });
}
