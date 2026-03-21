import type { FastifyInstance } from 'fastify';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { uploadCertificateController } from './v1-upload-certificate.controller';
import { listCertificatesController } from './v1-list-certificates.controller';
import { deleteCertificateController } from './v1-delete-certificate.controller';

export async function signatureCertificatesRoutes(app: FastifyInstance) {
  // Admin routes with elevated rate limit
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteCertificateController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(uploadCertificateController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listCertificatesController);
    },
    { prefix: '' },
  );
}
