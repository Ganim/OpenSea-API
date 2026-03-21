import type { FastifyInstance } from 'fastify';
import { getSigningPageController } from './v1-get-signing-page.controller';
import { signDocumentController } from './v1-sign-document.controller';
import { rejectDocumentController } from './v1-reject-document.controller';

export async function signatureSigningRoutes(app: FastifyInstance) {
  // Public routes — no auth required, token-based access
  await app.register(getSigningPageController);
  await app.register(signDocumentController);
  await app.register(rejectDocumentController);
}
