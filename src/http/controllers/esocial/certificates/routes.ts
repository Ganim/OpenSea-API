import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { v1GetCertificateController } from './v1-get-certificate.controller';
import { v1UploadCertificateController } from './v1-upload-certificate.controller';
import { v1DeleteCertificateController } from './v1-delete-certificate.controller';

export async function esocialCertificatesRoutes(app: FastifyInstance) {
  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetCertificateController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1UploadCertificateController);
      mutationApp.register(v1DeleteCertificateController);
    },
    { prefix: '' },
  );
}
