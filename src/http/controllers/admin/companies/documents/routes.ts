import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { createCompanyDocumentController } from './v1-create-company-document.controller';
import { deleteCompanyDocumentController } from './v1-delete-company-document.controller';
import { getCompanyDocumentFileController } from './v1-get-company-document-file.controller';
import { listCompanyDocumentsController } from './v1-list-company-documents.controller';

export async function adminCompanyDocumentsRoutes(app: FastifyInstance) {
  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createCompanyDocumentController);
      mutationApp.register(deleteCompanyDocumentController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listCompanyDocumentsController);
      queryApp.register(getCompanyDocumentFileController);
    },
    { prefix: '' },
  );
}
