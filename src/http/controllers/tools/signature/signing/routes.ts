import type { FastifyInstance } from 'fastify';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { getSigningPageController } from './v1-get-signing-page.controller';
import { signDocumentController } from './v1-sign-document.controller';
import { rejectDocumentController } from './v1-reject-document.controller';

export async function signatureSigningRoutes(app: FastifyInstance) {
  // Public routes — NO verifyJwt, NO verifyTenant
  // Rate limited to prevent abuse
  app.register(
    async (publicApp) => {
      publicApp.register(rateLimit, rateLimitConfig.public);
      publicApp.register(getSigningPageController);
      publicApp.register(signDocumentController);
      publicApp.register(rejectDocumentController);
    },
    { prefix: '' },
  );
}
