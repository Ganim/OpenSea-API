import type { FastifyInstance } from 'fastify';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createEnvelopeController } from './v1-create-envelope.controller';
import { listEnvelopesController } from './v1-list-envelopes.controller';
import { getEnvelopeByIdController } from './v1-get-envelope-by-id.controller';
import { cancelEnvelopeController } from './v1-cancel-envelope.controller';
import { resendNotificationsController } from './v1-resend-notifications.controller';
import { downloadSignedPdfController } from './v1-download-signed-pdf.controller';

export async function signatureEnvelopesRoutes(app: FastifyInstance) {
  // Admin routes with elevated rate limit
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(cancelEnvelopeController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createEnvelopeController);
      mutationApp.register(resendNotificationsController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listEnvelopesController);
      queryApp.register(getEnvelopeByIdController);
      queryApp.register(downloadSignedPdfController);
    },
    { prefix: '' },
  );
}
