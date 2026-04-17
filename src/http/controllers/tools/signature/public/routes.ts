import type { FastifyInstance } from 'fastify';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { verifyByCodeController } from './v1-verify-by-code.controller';
import { downloadSignedPdfPublicController } from './v1-download-signed-pdf-public.controller';

export async function signaturePublicRoutes(app: FastifyInstance) {
  // Public verification endpoints — NO verifyJwt, NO verifyTenant
  // Rate limited moderately (30 per minute) to allow normal consultation
  // but prevent scraping of all envelope codes.
  app.register(
    async (publicApp) => {
      publicApp.register(rateLimit, rateLimitConfig.signaturePublicVerify);
      publicApp.register(verifyByCodeController);
      publicApp.register(downloadSignedPdfPublicController);
    },
    { prefix: '' },
  );
}
